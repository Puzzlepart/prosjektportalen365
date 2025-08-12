

## Development Environment Configuration

_This section is currently in English, but we will add Norwegian translations in the future if needed._

### Environment Setup System

Prosjektportalen 365 uses a custom environment setup system to make it easy to develop against different SharePoint environments. This system consists of several components that work together:

#### 1. `environments.json`

This file defines multiple SharePoint environments you can develop against. Each environment specifies:

- `name`: A descriptive name for the environment (e.g., "Porteføljeoversikt", "Forside")
- `siteUrl`: The SharePoint site URL where your web part will be deployed
- `page`: The specific page on that site to load your web part
- `bundle`: Which SPFx web part bundle to use during development

Example:
```json
{
    "name": "Porteføljeoversikt",
    "siteUrl": "https://puzzlepart.sharepoint.com",
    "page": "SitePages/TestStdAln3.aspx",
    "bundle": "portfolio-overview-web-part"
}
```

#### 2. `.env` File

The `.env` file contains configuration variables for your development environment:

```
SERVE_ENVIRONMENT=Porteføljeoversikt
NODE_ENV=development
```

The key setting is `SERVE_ENVIRONMENT`, which specifies which environment from `environments.json` to use when running `npm run watch`. This lets you quickly switch between different SharePoint environments by changing just one value.

#### 3. Watch Scripts in `package.json`

The watch scripts tie everything together:

```json
"watch": "concurrently \"npm run serve\" \"livereload './dist/*.js' -e 'js' -w 250\"",
"prewatch": "node node_modules/pzl-spfx-tasks --pre-watch --loglevel silent",
"postwatch": "node node_modules/pzl-spfx-tasks --post-watch --loglevel silent",
```

- **prewatch**: Runs before the main watch script and uses the `pzl-spfx-tasks` package to:
  - Read the `SERVE_ENVIRONMENT` from `.env`
  - Find the matching environment in `environments.json`
  - Prepare the SPFx configuration based on the selected environment
  - Set up proper serve.json configuration
  - Configure bundle optimization for development

- **watch**: Runs the dev server with the environment configuration

- **postwatch**: Cleans up temporary files and configurations

### How It Works in Practice

1. Create or modify `.env` to set `SERVE_ENVIRONMENT` to your desired environment
2. Run `npm run watch`
3. The prewatch script configures everything based on the environment you selected
4. SPFx connects to the specified SharePoint site and page
5. Your web part bundle is loaded on that page for development and testing
6. When you make changes, the browser automatically refreshes

### Benefits of This Approach

- Define multiple development environments in one place
- Easily switch between environments by changing one variable
- Consistent configuration across the development team
- No need to manually edit SPFx configuration files

If you need to add a new environment for development, simply add a new entry to the `environments.json` file.