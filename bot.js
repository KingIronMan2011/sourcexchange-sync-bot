import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import fetch from "node-fetch";
import "dotenv/config";

const isDev = process.env.NODE_ENV === "development";

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

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

async function apiGet(path) {
  const res = await fetch("https://www.sourcexchange.net/api" + path, {
    headers: {
      Authorization: `Bearer ${process.env.API_TOKEN}`,
    },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = await res.text();
  }

  if (isDev) {
    console.log("API GET", path, "status", res.status, "response:", data);
  }

  if (!res.ok) {
    throw new Error(
      `${res.status} ${typeof data === "string" ? data : JSON.stringify(data)}`,
    );
  }

  return data;
}

async function getUserProductAccesses(discordId) {
  const userId = await apiGet(`/users/discord?id=${discordId}`);
  const productAccessesRaw = await apiGet(`/users/${userId}/accesses`);
  return Array.isArray(productAccessesRaw)
    ? productAccessesRaw
    : productAccessesRaw.data || [];
}

async function deployCommands() {
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
    body: commands,
  });

  console.log("Slash commands deployed");
}

client.once("clientReady", () => {
  deployCommands();

  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    status: "online",
    activities: [
      {
        name: "Checking purchases 💳",
        type: 3,
      },
    ],
  });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "products") {
    await interaction.deferReply({ flags: 64 });

    try {
      const productAccesses = await getUserProductAccesses(interaction.user.id);

      if (productAccesses.length === 0) {
        await interaction.editReply("You haven't purchased any products yet.");
        return;
      }

      const productDetails = await Promise.all(
        productAccesses.map((res) => apiGet(`/products/${res.product_id}`)),
      );
      const productNames = productDetails
        .map((res) => res.data?.name || res.name)
        .join(", ");

      await interaction.editReply(`**Purchased products:** ${productNames}`);
    } catch (error) {
      console.error(error);
      await interaction.editReply(
        "Failed to fetch products. Make sure your Discord is linked.",
      );
    }
  } else if (interaction.commandName === "sync") {
    await interaction.deferReply({ flags: 64 });

    try {
      const productAccesses = await getUserProductAccesses(interaction.user.id);
      const targetProductId = parseInt(process.env.PRODUCT_ID);
      const hasProduct = productAccesses.some(
        (access) => access.product_id === targetProductId,
      );

      const member = await interaction.guild.members.fetch(interaction.user.id);
      const role = await interaction.guild.roles.fetch(
        process.env.DISCORD_ROLE_ID,
      );

      if (!role) {
        await interaction.editReply("Role not found in this server.");
        return;
      }

      const hasRole = member.roles.cache.has(role.id);

      if (hasProduct && !hasRole) {
        await member.roles.add(role);
        await interaction.editReply(`Role **${role.name}** has been added!`);
      } else if (!hasProduct && hasRole) {
        await member.roles.remove(role);
        await interaction.editReply(`Role **${role.name}** has been removed.`);
      } else if (hasProduct && hasRole) {
        await interaction.editReply(
          `You already have the **${role.name}** role.`,
        );
      } else {
        await interaction.editReply("You don't have access to this product.");
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply(
        "Failed to sync roles. Make sure your Discord is linked.",
      );
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
