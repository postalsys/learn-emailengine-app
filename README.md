# EmailEngine Documentation Site

This is the comprehensive documentation website for EmailEngine, built with Docusaurus 3.9.

## Overview

This documentation site includes:
- **Getting Started Guide** - Introduction and quick start guides
- **Installation Instructions** - Multiple deployment options
- **Configuration Documentation** - Complete configuration reference
- **Usage Guides** - How to use EmailEngine features
- **API Reference** - Auto-generated from OpenAPI specification (74 endpoints)
- **Integration Guides** - Gmail, Outlook, and other providers
- **Blog** - 49+ tutorials, use cases, and updates

## Project Structure

```
emailengine-docu/
├── docs/                      # Documentation content
│   ├── getting-started/       # Introduction and overview
│   ├── installation/          # Installation guides
│   ├── configuration/         # Configuration options
│   ├── usage/                 # Feature guides
│   ├── integrations/          # Provider integrations
│   ├── troubleshooting/       # Common issues
│   ├── support/               # Support and legal
│   └── api/                   # Auto-generated API docs (74 endpoints)
├── blog/                      # Blog posts (49+ articles)
├── sources/                   # Source content
│   ├── swagger.json          # OpenAPI specification
│   ├── openapi/              # Split OpenAPI files
│   ├── website/              # Original HTML docs
│   └── blog/                 # Original blog posts
├── src/                       # React components
├── static/                    # Static assets
├── docusaurus.config.ts      # Site configuration
└── sidebars.ts               # Sidebar configuration
```

## Installation

```bash
npm install
```

## Local Development

Start the development server:

```bash
npm start
```

The site will be available at `http://localhost:3000/`

Features in development mode:
- Hot reload for instant preview
- Fast refresh
- Error overlay
- Live editing

## Build

Build the static site for production:

```bash
npm run build
```

The build output will be in the `build/` directory.

Test the production build locally:

```bash
npm run serve
```

## OpenAPI Integration

The API documentation is automatically generated from the OpenAPI specification using `docusaurus-plugin-openapi-docs`.

### Regenerating API Docs

```bash
# Clean existing API docs
npm run docusaurus clean-api-docs emailengine

# Generate fresh API docs
npm run docusaurus gen-api-docs emailengine
```

### API Structure

- **Source**: `sources/swagger.json`
- **Output**: `docs/api/`
- **Endpoints**: 74 API endpoints organized by 17 categories
- **Categories**: Account, Mailbox, Message, Submit, Outbox, Delivery Test, Access Tokens, Settings, Templates, Logs, Stats, License, Webhooks, OAuth2 Applications, SMTP Gateway, Blocklists, Multi Message Actions

## Documentation Structure

### Main Sections

1. **Getting Started** - Introduction to EmailEngine
2. **Installation** - Installation and deployment guides
3. **Configuration** - Configuration options and settings
4. **Usage Guide** - Feature guides (webhooks, sending, authentication, etc.)
5. **Integrations** - Gmail, Outlook, MS365 integrations
6. **Troubleshooting** - Common issues and solutions
7. **Support & Legal** - Support information and privacy policy
8. **API Reference** - Complete API documentation (separate sidebar)

### Blog

49+ articles covering tutorials, use cases, integration guides, and best practices.

Authors are defined in `blog/authors.yml`:
- **andris** - Andris Reinman (Creator of EmailEngine)
- **emailengine** - EmailEngine Team

## Deployment

The site can be deployed to any static hosting provider:

### Vercel

```bash
npm install -g vercel
vercel --prod
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

### GitHub Pages

```bash
GIT_USER=<username> npm run deploy
```

### Custom Server

```bash
npm run build
# Copy build/ directory to your web server
```

## Contributing

### Adding Documentation

1. Create a new `.md` file in the appropriate `docs/` subdirectory
2. Add frontmatter:
   ```yaml
   ---
   title: Your Page Title
   sidebar_position: 10
   ---
   ```
3. Preview with `npm start`
4. Build to verify: `npm run build`

### Adding Blog Posts

1. Create a file in `blog/` with format: `YYYY-MM-DD-slug.md`
2. Add frontmatter:
   ```yaml
   ---
   title: Post Title
   date: 2025-10-13
   authors: [andris]
   tags: [EmailEngine, Tutorial]
   description: Brief description
   ---
   ```
3. Write content below frontmatter

## Configuration

### Site Metadata

Edit `docusaurus.config.ts` for site configuration:
- Title, tagline, URL
- Navigation items
- Footer links
- Theme configuration
- Search configuration (Algolia)

### Custom Styling

Edit `src/css/custom.css` for custom styles.

### Components

Customize React components in `src/components/`:
- `HomepageFeatures/` - Landing page features
- Additional components can be swizzled from the theme

## Troubleshooting

### Build Errors

If build fails:
1. Clear cache: `npm run clear`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check for syntax errors in markdown files
4. Ensure all referenced images exist

### Development Server Issues

1. Check port 3000 is not in use
2. Clear cache: `rm -rf .docusaurus`
3. Restart: `npm start`

### API Documentation Issues

1. Validate OpenAPI spec: `npx swagger-cli validate sources/swagger.json`
2. Regenerate API docs (see commands above)

## Scripts

- `npm start` - Start development server
- `npm run build` - Build production site
- `npm run serve` - Serve production build locally
- `npm run clear` - Clear cache
- `npm run swizzle` - Customize theme components
- `npm run deploy` - Deploy to GitHub Pages

## Known Issues

### Problematic Blog Posts

The following blog posts were moved to `blog-backup/` due to MDX parsing issues:
- `2023-03-10-packaging-and-selling-a-node-js-app.md`
- `2025-03-27-data-compliance.md`
- `2023-03-14-making-email-html-webpage-compatible-with-emailengine.md`
- `2024-02-27-how-i-turned-my-open-source-project-into.md`
- `2022-10-12-tracking-bounces.md`
- `2022-05-28-mining-email-data-for-fun-and-profit.md`

These can be fixed by escaping JSX-like syntax or converting to proper fenced code blocks.

### Image Placeholders

Some blog posts reference images with `__GHOST_URL__` placeholders. These should be:
1. Downloaded from the original Ghost blog
2. Placed in `static/img/blog/`
3. Referenced with proper paths in the markdown

## Dependencies

### Core
- `@docusaurus/core`: ^3.9.1
- `@docusaurus/preset-classic`: ^3.9.1
- `react`: ^19.2.0
- `react-dom`: ^19.2.0

### OpenAPI
- `docusaurus-plugin-openapi-docs`: ^4.5.1
- `docusaurus-theme-openapi-docs`: ^4.5.1

### Development
- `jsdom`: ^25.0.1
- `turndown`: ^7.2.0
- `js-yaml`: ^4.1.0

## License

Copyright © 2025 Postal Systems OÜ

## Support

- **Documentation**: https://emailengine.app
- **GitHub**: https://github.com/postalsys/emailengine
- **License**: https://postalsys.com/plans

---

Built with [Docusaurus](https://docusaurus.io/) 3.9.1
