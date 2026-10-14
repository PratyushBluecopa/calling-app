# Bluecopa React App with shadcn/ui

A modern, production-ready template for building full-stack React applications using React Router v7 and shadcn/ui components.

## Features

- 🚀 **React Router v7** - Latest React Router with server-side rendering
- ⚡️ **Hot Module Replacement (HMR)** - Lightning-fast development experience
- 📦 **Asset bundling and optimization** - Vite-powered build system
- 🔄 **Data loading and mutations** - Built-in data fetching patterns
- 🔒 **TypeScript by default** - Full type safety and developer experience
- 🎨 **shadcn/ui Components** - Beautiful, accessible UI components built on Radix UI
- 🎉 **TailwindCSS v4** - Latest Tailwind with CSS variables and modern features
- 📊 **Data Visualization** - Recharts integration for charts and analytics
- 🗂️ **Data Tables** - TanStack Table with sorting, filtering, and pagination
- 🎯 **Drag & Drop** - DND Kit integration for interactive interfaces
- 📱 **Responsive Design** - Mobile-first approach with sidebar navigation
- 🌙 **Dark Mode** - Built-in theme switching with next-themes
- 🔗 **Bluecopa API integration** - Pre-configured with `@bluecopa/react` hooks
- 📖 [React Router docs](https://reactrouter.com/)
- 🎨 [shadcn/ui docs](https://ui.shadcn.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
# or
pnpm install
```

**Note:** The application includes TanStack Query integration through the `@bluecopa/react` package for data fetching and caching, along with shadcn/ui components for a modern UI experience.

## Quick Start

This template is designed to work both as a standalone application and as a microfrontend within the Bluecopa ecosystem. It includes:

- **Single-spa integration** for microfrontend architecture
- **Module federation** support for dynamic imports
- **Bluecopa API integration** with pre-configured hooks
- **Production-ready** Docker configuration

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:8080`.

## UI Components

This template includes a comprehensive set of shadcn/ui components:

### Layout Components

- **Sidebar** - Collapsible navigation sidebar with mobile support
- **Sheet** - Slide-out panels for mobile navigation
- **Drawer** - Bottom drawer for mobile interactions

### Form Components

- **Button** - Multiple variants and sizes
- **Input** - Text input with validation states
- **Select** - Dropdown selection with search
- **Checkbox** - Checkbox with indeterminate state
- **Label** - Accessible form labels

### Data Display

- **Table** - Sortable, filterable data tables with TanStack Table
- **Card** - Content containers with header, content, and footer
- **Badge** - Status indicators and labels
- **Avatar** - User profile images with fallbacks
- **Skeleton** - Loading placeholders

### Navigation

- **Tabs** - Tabbed content organization
- **Breadcrumb** - Navigation breadcrumbs
- **Dropdown Menu** - Context menus and actions
- **Tooltip** - Hover information

### Feedback

- **Sonner** - Toast notifications
- **Separator** - Visual content dividers

### Charts

- **Interactive Charts** - Recharts integration with hover states
- **Area Charts** - Time series data visualization

### Bluecopa API Configuration

This application integrates with the Bluecopa API using the `@bluecopa/react` package. To use the `useUser` hook for displaying logged-in user information, set up the following environment variables:

Create a `.env` file in the root directory:

```bash
# Bluecopa API Configuration
VITE_BLUECOPA_API_URL=https://develop.bluecopa.com
VITE_BLUECOPA_WORKSPACE_ID=your_workspace_id_here
VITE_BLUECOPA_API_TOKEN=your_base64_encoded_token_here
```

**Note:** `VITE_BLUECOPA_API_TOKEN` should be a base64-encoded JSON string containing an `accessToken` field, for example:

```json
{ "accessToken": "your_access_token_here" }
```

encoded as base64.

If the API errors out or is not configured, the application will show "Set Environment" as the user name with email "setenv@email.com" as a fallback.

### Statement Hooks Example

This template includes a comprehensive example of using Bluecopa statement hooks at `/statements`. The example demonstrates:

- **useGetStatementData** - Fetching statement data by statement ID (with optional viewId and runId)
- **useGetViewsBySheetId** - Fetching all views for a statement sheet
- **useGetRunsByViewId** - Fetching all runs for a statement view
- **useGetViewById** - Fetching specific view details
- **useGetRunResultById** - Fetching specific run results
- **useCreateStatementRun** - Creating new statement runs with mutations

The example includes two pre-configured statement IDs:

- Example 1: `MDYK9CU8NR1S41AFAOEX` (uses default view)
- Example 2: `MGIZ7GD08NQJ71SK8RA7` with View ID `MGJ1ZF0JN53B0V0YH10Z`

**Note:** The statement hooks require `@bluecopa/react` version 0.1.16 or higher. Update your `package.json` to use the latest version that includes these hooks.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Adding More Components

This template uses shadcn/ui CLI for adding new components. To add additional components:

```bash
# Install shadcn/ui CLI globally
npm install -g shadcn-ui@latest

# Add components
npx shadcn-ui@latest add [component-name]

# Examples
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add toast
```

## Styling

This template comes with [Tailwind CSS v4](https://tailwindcss.com/) configured with:

- CSS variables for theming
- Dark mode support with next-themes
- shadcn/ui design system
- Custom Bluecopa color palette
- Responsive design utilities

## Key Technologies

- **React 18** - Latest React with concurrent features
- **React Router v7** - Modern routing with SSR support
- **shadcn/ui** - Accessible component library built on Radix UI
- **Tailwind CSS v4** - Utility-first CSS framework
- **TanStack Table** - Headless table library for React
- **Recharts** - Composable charting library
- **DND Kit** - Drag and drop toolkit
- **Lucide React** - Beautiful icon library
- **TypeScript** - Type safety and developer experience

---

Built with ❤️ using React Router v7 and shadcn/ui.
