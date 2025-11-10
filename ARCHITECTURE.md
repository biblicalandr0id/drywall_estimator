# Monorepo Architecture

## Overview

This document describes the architecture of the drywall estimator monorepo, explaining the design decisions, package structure, and scalability considerations.

## Architecture Principles

### 1. Separation of Concerns

Each package has a specific responsibility:
- **Types**: Shared type definitions (no logic)
- **Core**: Pure calculation logic (framework-agnostic)
- **Blueprint Engine**: Canvas drawing and room detection (DOM-dependent)
- **Web App**: UI and user interaction (application layer)

### 2. Dependency Direction

Dependencies flow in one direction, preventing circular dependencies:

```
types ← core ← blueprint-engine ← web-app
                                   ↑
                                   └─ apps/desktop, apps/mobile (future)
```

### 3. Framework Agnostic Core

The `@drywall/core` package is pure TypeScript with no framework dependencies. This allows:
- Reuse in Node.js servers
- Reuse in mobile apps (React Native)
- Reuse in desktop apps (Electron)
- Easy testing without DOM mocking

### 4. Modular Bundling

Each package is independently bundled:
- **Core/Blueprint**: Bundled with tsup (CJS + ESM)
- **Web App**: Bundled with Vite
- Tree-shakeable exports
- Optimized bundle sizes

## Package Details

### @drywall/types

**Purpose**: Shared TypeScript type definitions

**Dependencies**: None

**Exports**:
```typescript
// Room and project types
export interface Room { ... }
export interface Project { ... }

// Calculation result types
export interface WallAreaResult { ... }
export interface ProjectEstimate { ... }

// Configuration types
export interface Pricing { ... }
export interface EstimateOptions { ... }
```

**Design Notes**:
- Pure type definitions (no runtime code)
- Consumed by all other packages
- Single source of truth for data shapes

### @drywall/core

**Purpose**: Core business logic and calculations

**Dependencies**: `@drywall/types`

**Exports**:
```typescript
export class DrywallCalculator { ... }
export const calculator // Singleton instance
export const RecommendationEngine { ... }
export const Utils { ... }
```

**Key Features**:
- **DrywallCalculator**: All material and cost calculations
  - Wall/ceiling/stairwell area calculations
  - Material quantity calculations (sheets, mud, tape, etc.)
  - Cost estimation with markup
  - Installation time estimation
  - Waste optimization

- **RecommendationEngine**: Smart suggestions
  - Material recommendations (moisture-resistant, fire-rated)
  - Code compliance checks (IRC)
  - Cost optimization suggestions
  - Best practices guidance

- **Utils**: Helper functions
  - Geometry calculations
  - Unit conversions
  - Formatting utilities

**Design Notes**:
- No DOM dependencies
- No framework dependencies
- Pure functions where possible
- Heavily tested with unit tests

### @drywall/blueprint-engine

**Purpose**: Canvas-based blueprint drawing system

**Dependencies**: `@drywall/types`, `@drywall/core`

**Exports**:
```typescript
export class BlueprintManager { ... }
```

**Key Features**:
- Multi-layered canvas rendering (grid, blueprint, overlay)
- Drawing tools (walls, doors, windows, stairs)
- Room detection algorithm
- Pan and zoom with mouse/touch
- Undo/redo system (50 state history)
- Selection and manipulation
- Export to PNG/JSON

**Design Notes**:
- Isolated from business logic
- Can be reused in different UIs
- Handles all canvas interactions
- Optimized rendering with requestAnimationFrame

### @drywall/web-app

**Purpose**: Main web application with UI

**Dependencies**: All packages

**Structure**:
```
web-app/
├── src/
│   ├── app.ts              # Main application controller
│   ├── components/         # UI components (future)
│   └── styles/            # CSS modules (future)
├── public/
│   └── styles.css         # Global styles
└── index.html             # Entry point
```

**Design Notes**:
- Uses Vite for fast development
- Will be converted to TypeScript
- Can be progressively enhanced with components
- Currently uses vanilla JS/DOM APIs

## Data Flow

### Typical User Flow

```
User draws on canvas
    ↓
BlueprintManager captures drawing
    ↓
Room detection algorithm runs
    ↓
Rooms converted to Project data structure
    ↓
DrywallCalculator processes project
    ↓
RecommendationEngine analyzes project
    ↓
Results displayed to user
```

### Example Code Flow

```typescript
// 1. User finishes drawing
blueprintManager.detectRooms();

// 2. Get project data
const project = blueprintManager.getProjectData();

// 3. Calculate estimate
const estimate = calculator.calculateProjectEstimate(
  project,
  pricing,
  laborRates,
  options
);

// 4. Get recommendations
const recommendations = RecommendationEngine.generateRecommendations(
  project,
  estimate
);

// 5. Display results
displayEstimate(estimate);
displayRecommendations(recommendations);
```

## Build System

### Turborepo Configuration

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],      // Build dependencies first
      "outputs": ["dist/**"],        // Cache these directories
      "env": ["NODE_ENV"]
    },
    "test": {
      "dependsOn": ["^build"],      // Tests need built packages
      "outputs": ["coverage/**"]
    }
  }
}
```

### Build Order

1. `@drywall/types` (no dependencies)
2. `@drywall/core` (depends on types)
3. `@drywall/blueprint-engine` (depends on types, core)
4. `@drywall/web-app` (depends on all)

Turborepo automatically figures this out and builds in parallel where possible.

### Package Bundling

**For libraries (core, blueprint-engine)**:
- Bundled with `tsup`
- Outputs: CommonJS + ESM
- Generates .d.ts type definitions
- Tree-shakeable

**For web app**:
- Bundled with `Vite`
- Optimized for modern browsers
- Code splitting
- Asset optimization

## Testing Strategy

### Unit Tests (Vitest)

```
packages/core/tests/
├── calculator.test.ts      # Calculator functions
├── recommendations.test.ts # Recommendation logic
└── utils.test.ts          # Utility functions
```

Focus: Pure calculation logic

### Integration Tests (Future)

```
packages/blueprint-engine/tests/
└── room-detection.test.ts  # Room detection algorithm
```

Focus: Component interactions

### E2E Tests (Future)

```
packages/web-app/tests/
└── e2e/
    ├── drawing.spec.ts     # Canvas interactions
    ├── calculations.spec.ts # Full workflow
    └── export.spec.ts      # Export functionality
```

Focus: User workflows

## Scalability Considerations

### Adding New Packages

To add a new package:

1. Create package directory:
   ```bash
   mkdir -p packages/new-package/src
   ```

2. Add package.json:
   ```json
   {
     "name": "@drywall/new-package",
     "dependencies": {
       "@drywall/core": "workspace:*"
     }
   }
   ```

3. Add to tsconfig.json references:
   ```json
   {
     "references": [
       { "path": "./packages/new-package" }
     ]
   }
   ```

4. Run `pnpm install`

### Adding New Apps

Example: Mobile app

```
apps/mobile/
├── src/
│   └── App.tsx
├── package.json           # Depends on @drywall/core
└── app.json
```

The mobile app can import and use all calculation logic:

```typescript
import { DrywallCalculator } from '@drywall/core';

// Use the same calculation logic as web app
const estimate = calculator.calculateProjectEstimate(...);
```

### Horizontal Scaling

As the codebase grows, you can split packages further:

```
packages/
├── core-calculations/     # Pure math
├── core-recommendations/  # Recommendation logic
├── core-validation/       # Data validation
├── ui-components/         # Shared UI components
├── theme/                # Design system
└── ...
```

### Vertical Scaling

Add new applications that share the core:

```
apps/
├── web/                  # Main web app
├── mobile/              # React Native
├── desktop/             # Electron
├── api/                 # REST/GraphQL API
└── cli/                 # Command-line tool
```

## Performance Optimizations

### Build Performance

- **Turborepo caching**: Reuses previous build outputs
- **Parallel builds**: Independent packages build simultaneously
- **Incremental compilation**: TypeScript project references

### Runtime Performance

- **Code splitting**: Web app loads only needed code
- **Tree shaking**: Unused exports are removed
- **Lazy loading**: Future feature for heavy components

### Development Performance

- **Hot Module Replacement**: Vite provides instant updates
- **Fast testing**: Vitest is 10x faster than Jest
- **Incremental type checking**: Only checks changed files

## Security Considerations

### Dependency Management

- **pnpm**: Strict dependency isolation (no phantom dependencies)
- **Workspace protocol**: Internal packages don't go through registry
- **Regular updates**: Use `pnpm update` to keep dependencies current

### Type Safety

- **TypeScript strict mode**: Catches many errors at compile time
- **No implicit any**: All types must be explicit
- **Shared types**: Ensures consistency across packages

### Future Considerations

- Input validation for user data
- Sanitization of HTML output
- HTTPS for production deployment
- Content Security Policy headers

## Future Enhancements

### Short Term

1. **Complete TypeScript migration**: Convert all .js files
2. **Improve test coverage**: Aim for 80%+ coverage
3. **Add E2E tests**: Playwright for critical workflows
4. **CI/CD pipeline**: GitHub Actions for automated testing

### Medium Term

1. **Component library**: Extract reusable UI components
2. **Design system**: Consistent theming and styling
3. **Performance monitoring**: Track bundle sizes, build times
4. **Documentation site**: VitePress or Docusaurus

### Long Term

1. **Mobile application**: React Native app using core
2. **API server**: Node.js backend for project storage
3. **Collaboration features**: Multi-user editing
4. **Plugin system**: Allow third-party extensions

## Conclusion

This monorepo architecture provides:

✅ **Clear separation of concerns**
✅ **Reusable core logic**
✅ **Type safety throughout**
✅ **Fast development workflow**
✅ **Scalable foundation**
✅ **Easy testing strategy**

The foundation is now in place to scale the project in multiple directions while maintaining code quality and developer productivity.
