# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern web application built with Astro 5, React 19, TypeScript 5, and Tailwind CSS 4. The project uses Server-Side Rendering (SSR) with the Node adapter in standalone mode and runs on port 3000.

## Tech Stack

- **Astro 5**: Modern web framework with SSR enabled
- **React 19**: UI library for interactive components (no Next.js directives like "use client")
- **TypeScript 5**: Type-safe development with path aliases (`@/*` → `./src/*`)
- **Tailwind CSS 4**: Utility-first CSS via Vite plugin
- **Shadcn/ui**: UI component library
- **Supabase**: Backend services for authentication and database
- **Zod**: Runtime type validation

## Development Commands

### Core Commands
```bash
npm install          # Install dependencies (first time setup)
npm run dev          # Start dev server on port 3000
npm run build        # Build for production
npm run preview      # Preview production build
npm run astro        # Run Astro CLI commands
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
```

### Testing
Note: No test framework is currently configured in this project.

### Git Workflow
- Pre-commit hook automatically runs `lint-staged` which:
  - Runs `eslint --fix` on `*.{ts,tsx,astro}` files
  - Runs `prettier --write` on `*.{json,css,md}` files

## Project Architecture

### Directory Structure

```
./src/
├── layouts/              # Astro layouts
├── pages/                # Astro pages (file-based routing)
│   └── api/              # API endpoints (use uppercase GET, POST)
├── components/           # UI components
│   ├── ui/               # Shadcn/ui components
│   └── hooks/            # Custom React hooks
├── lib/                  # Services and utility functions
│   └── services/         # Business logic extracted from API routes
├── middleware/
│   └── index.ts          # Astro middleware
├── db/                   # Supabase clients and types
├── types.ts              # Shared types (Entities, DTOs)
├── assets/               # Internal static assets
└── styles/               # Global styles
```

### Component Architecture

- **Astro Components** (`.astro`): Use for static content and layouts
- **React Components** (`.tsx`): Use only when interactivity is needed
- Astro config uses `output: "server"` for SSR across all pages
- **Client directives**: When using React components in Astro:
  - `client:load` - Load immediately on page load
  - `client:idle` - Load when browser is idle
  - `client:visible` - Load when component enters viewport
  - `client:only="react"` - Only render on client (skip SSR)

### API Routes

- Location: `src/pages/api/`
- Use uppercase HTTP method handlers: `GET`, `POST`
- Always add `export const prerender = false` for API routes
- Validate input with Zod schemas
- Extract business logic to `src/lib/services/`
- Access Supabase via `context.locals.supabase` (not direct imports)

## Coding Practices

### Error Handling Pattern
- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions
- Place the happy path last for readability
- Avoid unnecessary `else` statements
- Use guard clauses for preconditions

### React Best Practices
- Never use "use client" or other Next.js directives
- Extract logic into custom hooks in `src/components/hooks/`
- Use `React.memo()` for expensive components with stable props
- Use `React.lazy()` and `Suspense` for code-splitting
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations
- Use `useId()` for accessibility IDs
- Consider `useOptimistic` for optimistic UI updates
- Use `useTransition` for non-urgent state updates

### Astro Best Practices
- Leverage View Transitions API (use ClientRouter)
- Use content collections with type safety for content
- Use `Astro.cookies` for server-side cookie management
- Access environment variables via `import.meta.env`
- Use image optimization with Astro Image integration

### Tailwind CSS Guidelines
- Use `@layer` directive for organizing styles
- Use arbitrary values with square brackets (e.g., `w-[123px]`)
- Implement dark mode with `dark:` variant
- Use responsive variants (`sm:`, `md:`, `lg:`, etc.)
- Use state variants (`hover:`, `focus-visible:`, `active:`, etc.)

### Accessibility Requirements
- Use ARIA landmarks for page regions
- Apply appropriate ARIA roles to custom elements
- Set `aria-expanded` and `aria-controls` for expandable content
- Use `aria-live` regions for dynamic content updates
- Use `aria-label` or `aria-labelledby` for elements without visible labels
- Use `aria-describedby` for form inputs
- Implement `aria-current` for current items in navigation
- Avoid redundant ARIA that duplicates native HTML semantics

### Backend and Database
- Use Supabase for authentication and database
- Validate all backend data exchanges with Zod schemas
- Import `SupabaseClient` type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`
- Access Supabase from `context.locals` in Astro routes

## ESLint Configuration

The project uses a flat config with:
- TypeScript ESLint (strict + stylistic)
- React plugin with hooks rules
- React Compiler plugin (enforced)
- JSX Accessibility (a11y) plugin
- Astro plugin
- Prettier integration
- Rule: `no-console: "warn"` - avoid console statements
- Rule: `react/react-in-jsx-scope: "off"` - React 19 auto-imports
- Rule: `react-compiler/react-compiler: "error"` - React Compiler required

## Environment Setup

- Node.js v22.14.0 (see `.nvmrc`)
- TypeScript path alias: `@/*` maps to `./src/*`
- Dev server port: 3000
