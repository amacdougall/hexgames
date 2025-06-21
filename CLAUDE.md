# CLAUDE.md

This file provides guidance to AI coding assistants when working with code in
this repository. If you are an AI coding assisant, please follow these
instructions!

## Development Commands

### Build and Development

```bash
# Install all dependencies (from root)
npm install

# Build all packages
npm run build

# Start development with hot reload
npm run dev

# Clean all build outputs
npm run clean

# Build just the hexboard library
cd packages/hexboard && npm run build

# Watch mode for library development
cd packages/hexboard && npm run dev

# Start test application
cd apps/hexboard-test && npm run dev
```

### Testing

```bash
# Run all tests (from hexboard package)
cd packages/hexboard && npm run test

# Run tests in watch mode
cd packages/hexboard && npm run test:watch

# Generate coverage report
cd packages/hexboard && npm run test:coverage
```

## Architecture Overview

This is a **TypeScript monorepo** for hexagonal grid-based games using npm workspaces. The project separates game logic from 3D rendering through a clean layered architecture.

### Project Structure

- **`packages/hexboard/`** - Core library with hex grid logic and Three.js rendering
- **`apps/hexboard-test/`** - Test application demonstrating library features
- **Workspace linking** - Test app automatically uses local hexboard library

### Core Architecture Layers

1. **Logic Layer** (`src/core/`)

   - `HexGrid` class manages game state with no rendering dependencies
   - pure logic, should not import rendering modules or game logic
   - Uses cubic coordinates (q, r, s) for hexagonal calculations
   - Generic cell system with `<CustomProps extends object>` for type-safe extensibility
   - 20+ utility methods for hex operations

2. **Rendering Layer** (`src/rendering/`)

   - use `src/core` classes as data source
   - `BoardRenderer` handles Three.js 3D visualization
   - `layout.ts` converts hex coordinates to world coordinates (flat-top hexagons)
   - Supports interactive OrbitControls, shadows, and terrain color coding

3. **API Layer**
   - `HexBoard` class combines logic and rendering
   - Main entry point in `src/index.ts`

### Key Design Decisions

- **Separation of concerns**: Logic layer has zero rendering dependencies
- **Type safety**: No `any` types, extensive use of TypeScript generics
- **Coordinate system**: Cubic coordinates for hexagonal grid calculations
- **Performance**: Map-based cell lookup, resource cleanup methods

### Current Implementation Status

- ✅ Core hex grid functionality with 20+ methods
- ✅ 3D rendering with Three.js (terrain visualization, shadows, controls)
- ✅ Interactive test application with live demo
- ✅ Comprehensive test suite with 80% coverage threshold
- 🏗️ Future: Entity system, pathfinding, advanced animations

## Working with the Codebase

### Adding New Features

1. Core logic goes in `packages/hexboard/src/core/`
2. 3D rendering features go in `packages/hexboard/src/rendering/`
3. Always maintain separation - core logic should not import rendering modules
4. Add tests in `tests/` directory following existing patterns

### Testing Strategy

- Jest configuration excludes 3D rendering from coverage (requires DOM/WebGL)
- Focus unit tests on core logic in `src/core/`
- Integration tests demonstrate complete workflows
- Coverage threshold: 80% for branches, functions, lines, statements

### Development Workflow

1. Make changes to hexboard library
2. Build library: `cd packages/hexboard && npm run build`
3. Test app automatically picks up changes via workspace linking
4. View live demo: `cd apps/hexboard-test && npm run dev`
