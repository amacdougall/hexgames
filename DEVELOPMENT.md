# Development Setup

This document describes how to work with the hexboard monorepo.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build all packages:
   ```bash
   npm run build
   ```

3. Start the development server for the test application:
   ```bash
   cd apps/hexboard-test
   npm run dev
   ```

## Workspace Structure

- `packages/hexboard/` - The main hexboard library
- `apps/hexboard-test/` - Test application demonstrating library usage
- `tsconfig.base.json` - Shared TypeScript configuration

## Development Workflow

### Building the Library

```bash
cd packages/hexboard
npm run build        # One-time build
npm run dev          # Watch mode for development
```

### Running the Test Application

```bash
cd apps/hexboard-test
npm run dev          # Start development server
npm run build        # Build for production
```

### Building Everything

From the root directory:
```bash
npm run build        # Builds all packages
npm run clean        # Cleans all build outputs
```

## Package Dependencies

The test application automatically uses the local version of hexboard through workspace linking. Changes to the hexboard library are immediately available to the test app after rebuilding.

## Next Steps

The project structure is ready for implementing the hexboard library according to the technical specification. The main implementation areas are:

1. Core coordinate system (`packages/hexboard/src/core/coordinates.ts`)
2. Cell and grid logic (`packages/hexboard/src/core/`)
3. Three.js rendering (`packages/hexboard/src/rendering/`)
4. Map definitions (`packages/hexboard/src/map/`)
5. Main HexBoard class (`packages/hexboard/src/hexBoard.ts`)
