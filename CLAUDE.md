# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal technical blog and documentation site built with Docusaurus 3.7, a React-based static site generator. The site is deployed to GitHub Pages at https://baohoangstan.github.io and contains technical notes, workspace setup guides, and blog posts covering software development topics.

## Technology Stack

- **Framework**: Docusaurus 3.7 (React 18-based static site generator)
- **Language**: TypeScript 5.2
- **Package Manager**: Yarn (uses yarn.lock)
- **Node Version**: >= 18.0
- **Styling**: CSS Modules + custom CSS
- **Content**: MDX (Markdown + JSX)
- **Deployment**: GitHub Pages via GitHub Actions

## Common Commands

### Development
```bash
# Start development server (default: http://localhost:3000)
yarn start

# Build for production
yarn build

# Serve production build locally
yarn serve

# Type check TypeScript
yarn typecheck

# Clear Docusaurus cache
yarn clear
```

### Content Management
```bash
# Generate translation files for i18n
yarn write-translations

# Add heading IDs to markdown files
yarn write-heading-ids
```

### Deployment
Deployment is automated via GitHub Actions on push to `main` branch. The workflow:
1. Builds the site using `yarn build`
2. Deploys to the `deploy` branch
3. GitHub Pages serves from the deployment artifact

Manual deployment (if needed):
```bash
yarn deploy
```

## Architecture

### Site Configuration

**docusaurus.config.ts**: Main configuration file containing:
- Site metadata (title, tagline, favicon)
- Deployment settings (GitHub Pages configuration)
- i18n support (English and Vietnamese locales)
- Google Analytics tracking (gtag)
- Sitemap configuration
- Theme configuration (navbar, footer, Prism themes)
- Plugin presets (docs, blog, theme)

**sidebars.ts**: Sidebar configuration for documentation pages. Currently uses auto-generation from the `docs/` folder structure.

### Content Structure

**docs/**: Documentation organized by category
- Auto-generated sidebar from directory structure
- Categories defined via `_category_.json` files
- Includes workspace setup guides (macOS, Linux, Windows)
- OSS project notes and trending repositories
- Team collaboration guides
- Debugging guides for various languages

**blog/**: Blog posts in MDX format
- `authors.yml`: Author information
- `tags.yml`: Tag definitions
- Individual posts in dated folders with assets

**src/pages/**: Custom React pages
- `index.tsx`: Homepage with features section
- Can add additional custom pages as needed

**src/components/**: React components
- `HomepageFeatures/`: Homepage feature showcase
- Uses CSS Modules for styling

**static/**: Static assets served directly
- Images (logo, favicon, social cards)
- `.nojekyll` file to prevent Jekyll processing on GitHub Pages

### Internationalization (i18n)

The site supports English (default) and Vietnamese:
- Locale switcher in navbar
- Localized content should follow Docusaurus i18n structure
- Translation files generated via `yarn write-translations`

### Content Frontmatter

Documentation files use frontmatter for metadata:
```markdown
---
sidebar_position: 1  # Order in sidebar
---
```

Blog posts support additional frontmatter (authors, tags, date, etc.) as per Docusaurus conventions.

### Styling Approach

- **Custom CSS**: `src/css/custom.css` for global styles and CSS variables
- **CSS Modules**: Component-specific styles (e.g., `styles.module.css`)
- **Prism Themes**: GitHub theme (light), Dracula theme (dark)

## Important Notes

### When Adding Content

1. **Documentation**: Add `.md` or `.mdx` files to appropriate subdirectory in `docs/`
   - Sidebar auto-generates from file structure
   - Use `_category_.json` to configure category display

2. **Blog Posts**: Create dated folders in `blog/` (e.g., `2024-08-05-welcome/`)
   - Include `index.md` with frontmatter
   - Place images and assets in the same folder

3. **Custom Pages**: Add React components to `src/pages/`
   - Route matches filename (e.g., `about.tsx` → `/about`)

### When Modifying Configuration

- Changes to `docusaurus.config.ts` require dev server restart
- Sidebar changes in `sidebars.ts` may require restart
- Theme customization uses CSS variables in `custom.css`

### TypeScript

- Uses Docusaurus TypeScript config as base (`@docusaurus/tsconfig`)
- Type checking available via `yarn typecheck`
- Module aliases and types provided by `@docusaurus/module-type-aliases`

### Deployment

- Auto-deploys on push to `main` branch
- Uses GitHub Actions workflow (`.github/workflows/deploy.yml`)
- Deploys to `deploy` branch, served by GitHub Pages
- Build artifacts uploaded to GitHub Pages environment
- Requires Node 18 and Yarn for CI/CD

### Content Categories

The site focuses on:
- **Workspace**: Development environment setup across different OS platforms
- **OSS**: Open-source software notes and trending projects
- **Team**: Team collaboration and workflow guides
- **Other**: Debugging guides and miscellaneous technical notes
