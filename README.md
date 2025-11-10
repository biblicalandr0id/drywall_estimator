# Drywall Estimator Monorepo

A professional, scalable drywall estimation tool with blueprint drawing capabilities and intelligent recommendations.

## 🏗️ Architecture

This is a monorepo containing multiple packages that work together to provide comprehensive drywall estimation capabilities.

### Packages

- **`@drywall/core`** - Core calculation logic, recommendations engine, and shared utilities
- **`@drywall/blueprint-engine`** - Canvas-based blueprint drawing and room detection
- **`@drywall/web-app`** - Main web application with Microsoft Word-style ribbon interface
- **`@drywall/types`** - Shared TypeScript type definitions

### Apps

- **`desktop`** - Future Electron desktop application
- **`mobile`** - Future mobile application

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Install pnpm globally if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install
```

### Development

```bash
# Start all packages in development mode
pnpm dev

# Start specific package
pnpm --filter @drywall/web-app dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

## 📦 Package Structure

```
drywall-estimator/
├── packages/
│   ├── core/                  # Calculation engine
│   ├── blueprint-engine/      # Drawing system
│   ├── web-app/              # Web application
│   └── types/                # Shared types
├── apps/
│   ├── desktop/              # Desktop app
│   └── mobile/               # Mobile app
└── tools/                    # Shared configurations
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

## 🛠️ Technologies

- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Build Tool**: Vite
- **Language**: TypeScript
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
