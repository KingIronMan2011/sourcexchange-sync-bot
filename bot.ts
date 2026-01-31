import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActivityType,
  Interaction,
  ChatInputCommandInteraction,
} from "discord.js";
import axios from "axios";
import "dotenv/config";

const isDev = process.env.NODE_ENV === "development";
const EPHEMERAL_FLAG = 64;

type ProductAccess = {
  product_id: number;
  [key: string]: any;
};

type ProductResponse = {
  data?: { name?: string };
  name?: string;
  [key: string]: any;
};

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const commands = [
  new SlashCommandBuilder()
    .setName("products")
    .setDescription("Show products bought by the user")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("sync")
    .setDescription("Sync user roles based on purchased products")
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(getEnv("DISCORD_TOKEN"));

async function apiGet<T = any>(path: string): Promise<T> {
  try {
    const res = await axios.get(getEnv("API_BASE_URL") + path, {
      headers: {
        Authorization: `Bearer ${getEnv("API_TOKEN")}`,
      },
    });

    if (isDev) {
      console.log("API GET", path, "status", res.status, "response:", res.data);
    }

    return res.data as T;
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (isDev) {
        console.log("API GET ERROR", path, "status", status, "response:", data);
      }
      throw new Error(
        `${status ?? "ERROR"} ${
          typeof data === "string" ? data : JSON.stringify(data)
        }`,
      );
    }
    throw err;
  }
}

async function getUserProductAccesses(
  discordId: string,
): Promise<ProductAccess[]> {
  const userId = await apiGet<string>(`/users/discord?id=${discordId}`);
  const productAccessesRaw = await apiGet<any>(`/users/${userId}/accesses`);
  return Array.isArray(productAccessesRaw)
    ? productAccessesRaw
    : productAccessesRaw.data || [];
}

async function deployCommands(): Promise<void> {
  await rest.put(Routes.applicationCommands(getEnv("CLIENT_ID")), {
    body: commands,
  });

  console.log("Slash commands deployed");
}

client.once("clientReady", () => {
  deployCommands().catch(console.error);

  if (!client.user) return;
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    status: "online",
    activities: [
      {
        name: "Checking purchases",
        type: ActivityType.Watching,
      },
    ],
  });
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = interaction as ChatInputCommandInteraction;

  if (cmd.commandName === "products") {
    await cmd.deferReply({ flags: EPHEMERAL_FLAG });

    try {
      const productAccesses = await getUserProductAccesses(cmd.user.id);

      if (productAccesses.length === 0) {
        await cmd.editReply("You haven't purchased any products yet.");
        return;
      }

      const productDetails = await Promise.all(
        productAccesses.map((access) =>
          apiGet<ProductResponse>(`/products/${access.product_id}`),
        ),
      );
      const productNames = productDetails
        .map((product) => product.data?.name || product.name || "Unknown")
        .join(", ");

      await cmd.editReply(`**Purchased products:** ${productNames}`);
    } catch (error) {
      console.error(error);
      await cmd.editReply(
        "Failed to fetch products. Make sure your Discord is linked.",
      );
    }
  } else if (cmd.commandName === "sync") {
    await cmd.deferReply({ flags: EPHEMERAL_FLAG });

    try {
      const productAccesses = await getUserProductAccesses(cmd.user.id);
      const targetProductId = parseInt(getEnv("PRODUCT_ID"), 10);
      const hasProduct = productAccesses.some(
        (access) => access.product_id === targetProductId,
      );

      if (!cmd.guild) {
        await cmd.editReply("This command must be used in a server.");
        return;
      }

      const member = await cmd.guild.members.fetch(cmd.user.id);
      const role = await cmd.guild.roles.fetch(getEnv("DISCORD_ROLE_ID"));

      if (!role) {
        await cmd.editReply("Role not found in this server.");
        return;
      }

      const hasRole = member.roles.cache.has(role.id);

      if (hasProduct && !hasRole) {
        await member.roles.add(role);
        await cmd.editReply(`Role **${role.name}** has been added!`);
      } else if (!hasProduct && hasRole) {
        await member.roles.remove(role);
        await cmd.editReply(`Role **${role.name}** has been removed.`);
      } else if (hasProduct && hasRole) {
        await cmd.editReply(`You already have the **${role.name}** role.`);
      } else {
        await cmd.editReply("You don't have access to this product.");
      }
    } catch (error) {
      console.error(error);
      await cmd.editReply(
        "Failed to sync roles. Make sure your Discord is linked.",
      );
    }
  }
});

client.login(getEnv("DISCORD_TOKEN"));
