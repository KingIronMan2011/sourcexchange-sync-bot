# SourceXchange Sync Bot

A Discord bot that automatically syncs user roles based on product purchases from [SourceXchange](https://www.sourcexchange.net). When users purchase your products on SourceXchange, this bot can grant them corresponding roles in your Discord server.

## Features

- 🔄 **Role Syncing** - Sync Discord roles based on SourceXchange product purchases
- 📦 **Product Listing** - View all products a user has purchased
- 🔐 **Secure API Integration** - Uses SourceXchange API with bearer token authentication
- ⚡ **Slash Commands** - Modern Discord slash command interface
- 🛡️ **Permission Handling** - Robust role management with error handling

## Quick Start

📖 **[View Installation Guide](https://github.com/KingIronMan2011/sourcexchange-sync-bot/wiki)** - Complete setup instructions available in the Wiki

## Available Commands

- `/products` - Shows all products the user has purchased on SourceXchange
- `/sync` - Syncs the user's Discord role based on their product purchases

## How It Works

1. User purchases a product on SourceXchange with their Discord account linked
2. User runs `/sync` command in your Discord server
3. Bot fetches user's product accesses from SourceXchange API
4. Bot checks if user has purchased the configured product
5. Bot adds or removes the configured role accordingly

## Development

### Code Formatting

```bash
npm run format        # Format code with Prettier
npm run format:check  # Check code formatting
```

### Linting

```bash
npm run lint      # Run ESLint
npm run lint:fix  # Fix ESLint issues automatically
```

### CI/CD

The project includes GitHub Actions workflows for:

- ✅ Prettier formatting checks
- ✅ ESLint validation

## Support

- 📖 [Documentation & Setup Guide](https://github.com/KingIronMan2011/sourcexchange-sync-bot/wiki)
- 💖 [Sponsor on GitHub](https://github.com/sponsors/KingIronMan2011)
- 🐛 [Report Issues](https://github.com/KingIronMan2011/sourcexchange-sync-bot/issues)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Disclaimer

This bot is not officially affiliated with SourceXchange. Make sure to comply with SourceXchange's Terms of Service and API usage guidelines.
