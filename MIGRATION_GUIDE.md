# Monorepo Migration Guide

This guide explains the transformation of the drywall estimator from a flat structure to a scalable monorepo.

## 📦 New Structure

```
drywall-estimator/
├── packages/
│   ├── types/              # Shared TypeScript types
│   ├── core/               # Core calculation logic
│   ├── blueprint-engine/   # Canvas drawing engine
│   └── web-app/           # Main web application
├── apps/                  # Future deployment targets
├── tools/                 # Shared configurations
└── [config files]
```

## 🔄 File Mapping

### Original → New Location

| Original File | New Location | Notes |
|--------------|--------------|-------|
| `calculator.js` | `packages/core/src/calculator/index.ts` | Converted to TypeScript class |
| `recommendations.js` | `packages/core/src/recommendations/index.ts` | Copied as-is, will be converted |
| `utils.js` | `packages/core/src/utils/index.ts` | Copied as-is, will be converted |
| `blueprint.js` | `packages/blueprint-engine/src/index.ts` | Copied as-is, will be converted |
| `app.js` | `packages/web-app/src/app.ts` | Copied as-is, will be converted |
| `index.html` | `packages/web-app/index.html` | Updated to use module imports |
| `styles.css` | `packages/web-app/public/styles.css` | Served as static asset |

## 🚀 Getting Started

### 1. Install pnpm (if not already installed)

```bash
npm install -g pnpm@9
```

### 2. Install all dependencies

```bash
pnpm install
```

This will install dependencies for all packages in the monorepo.

### 3. Build all packages

```bash
pnpm build
```

This builds packages in the correct order (types → core → blueprint-engine → web-app).

### 4. Start development server

```bash
# Start all packages in dev mode
pnpm dev

# Or start just the web app
pnpm --filter @drywall/web-app dev
```

The web app will be available at http://localhost:3000

## 📝 Development Workflow

### Working on a Specific Package

```bash
# Work on core package
cd packages/core
pnpm dev

# Run tests in watch mode
pnpm test:watch

# Build
pnpm build
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @drywall/core test

# Run tests in watch mode
pnpm --filter @drywall/core test:watch

# Run tests with coverage
pnpm --filter @drywall/core test --coverage
```

### Linting and Formatting

```bash
# Lint all packages
pnpm lint

# Format all files
pnpm format

# Check formatting
pnpm format:check
```

### Type Checking

```bash
# Type check all packages
pnpm type-check

# Type check specific package
pnpm --filter @drywall/core type-check
```

## 🔗 Package Dependencies

The packages have the following dependency structure:

```
@drywall/types (no dependencies)
    ↓
@drywall/core (depends on types)
    ↓
@drywall/blueprint-engine (depends on types, core)
    ↓
@drywall/web-app (depends on all above)
```

### How Workspace Dependencies Work

When you import from another package:

```typescript
// In packages/core/src/calculator/index.ts
import type { Room, Project } from '@drywall/types';

// In packages/web-app/src/app.ts
import { DrywallCalculator, Utils } from '@drywall/core';
import { BlueprintManager } from '@drywall/blueprint-engine';
```

pnpm automatically links these packages during development, so changes are reflected immediately.

## 📚 Key Technologies

### Monorepo Tools

- **pnpm workspaces**: Manages packages and dependencies
- **Turborepo**: Orchestrates builds, caching, and task running

### Build Tools

- **TypeScript**: Type-safe JavaScript
- **tsup**: Fast TypeScript bundler for packages
- **Vite**: Fast development server and bundler for web app

### Testing

- **Vitest**: Fast unit testing framework
- **Playwright** (future): End-to-end testing

### Code Quality

- **ESLint**: Linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

## 🎯 Next Steps

### Phase 1: Convert JavaScript to TypeScript

The existing .js files have been copied but need proper TypeScript conversion:

1. **recommendations.js → recommendations/index.ts**
   - Add proper types for all functions
   - Use @drywall/types for type imports
   - Export as class or object

2. **utils.js → utils/index.ts**
   - Add generic types for utility functions
   - Split into logical modules (geometry, units, dom)

3. **blueprint.js → blueprint-engine/src/index.ts**
   - Convert BlueprintManager to TypeScript class
   - Add Canvas API types
   - Add proper event handler types

4. **app.js → web-app/src/app.ts**
   - Convert DrywallEstimatorApp to TypeScript
   - Update imports to use workspace packages
   - Add proper DOM types

### Phase 2: Improve Testing

1. Add more unit tests for core calculations
2. Add integration tests for calculator + recommendations
3. Add E2E tests with Playwright for web app
4. Set up CI/CD with GitHub Actions

### Phase 3: Enhance Developer Experience

1. Add hot module reloading for all packages
2. Set up Storybook for component documentation
3. Add pre-commit hooks with husky
4. Set up semantic versioning and changelogs

### Phase 4: Add New Features

Now that the monorepo is set up, you can easily add:

1. **Mobile app** (apps/mobile)
   - React Native app
   - Shares @drywall/core for calculations

2. **Desktop app** (apps/desktop)
   - Electron wrapper
   - Uses @drywall/web-app as the UI

3. **API server** (packages/api)
   - REST or GraphQL API
   - Uses @drywall/core for calculations
   - Can store/retrieve projects

4. **CLI tool** (packages/cli)
   - Command-line tool for estimates
   - Uses @drywall/core

## 🔍 Understanding Turborepo

Turborepo intelligently caches build outputs and orchestrates tasks:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],  // Build dependencies first
      "outputs": ["dist/**"]     // Cache these outputs
    },
    "test": {
      "dependsOn": ["^build"],  // Tests need built packages
      "outputs": ["coverage/**"]
    }
  }
}
```

Benefits:
- ⚡ Only rebuilds changed packages
- 🚀 Runs independent tasks in parallel
- 💾 Caches build outputs locally
- 🔄 Runs tasks in topological order

## 📖 Additional Resources

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vitest Documentation](https://vitest.dev/)

## 🐛 Troubleshooting

### "Cannot find module '@drywall/core'"

Run `pnpm install` at the root to link workspace packages.

### "Type error" after making changes

Run `pnpm build` to rebuild packages, or use `pnpm dev` for auto-rebuild.

### Build is slow

Turborepo should cache builds. If it's slow, try:
```bash
pnpm clean        # Clean all build outputs
pnpm build        # Rebuild everything
```

### Tests are failing

Make sure packages are built first:
```bash
pnpm build
pnpm test
```

## 💡 Tips

1. **Use workspace protocol** in package.json dependencies: `"@drywall/core": "workspace:*"`
2. **Keep packages focused**: Each package should have a single responsibility
3. **Share types**: Put all shared types in `@drywall/types`
4. **Write tests**: Especially for `@drywall/core` calculations
5. **Use Turbo cache**: Speeds up repeated builds significantly

## 🎉 Benefits of Monorepo

✅ **Code Reuse**: Share calculation logic across web, mobile, API
✅ **Type Safety**: TypeScript catches errors at compile time
✅ **Atomic Changes**: Update multiple packages in one commit
✅ **Better Testing**: Test packages independently
✅ **Scalability**: Easy to add new apps and packages
✅ **Developer Experience**: Hot reloading, instant feedback
✅ **Performance**: Turborepo caching and parallel builds
