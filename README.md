# Hexgames Monorepo

A monorepo containing the `hexboard` library and client applications for
hexagonal grid-based games.

## Project Structure

```
/
├── package.json              # Root workspace configuration
├── tsconfig.base.json        # Base TypeScript configuration
├── packages/
│   └── hexboard/            # The hexboard library
│       ├── package.json
│       ├── tsconfig.json
│       └── src/             # Library source code
└── apps/
    └── hexboard-test/       # Test application
        ├── package.json
        ├── index.html
        ├── vite.config.ts
        └── src/             # Test app source code
```

## Getting Started

### Installation

Install dependencies for all packages:

```bash
npm install
```

### Development

Build the hexboard library:

```bash
cd packages/hexboard
npm run build
```

Run the test application in development mode:

```bash
cd apps/hexboard-test
npm run dev
```

### Workspace Commands

From the root directory, you can run commands across all packages:

```bash
npm run build    # Build all packages
npm run dev      # Start development mode for all packages
npm run clean    # Clean all build outputs
```

## Library Overview

The `hexboard` library provides:

- **Core Logic**: Hexagonal grid management, pathfinding, and game logic
- **3D Rendering**: Three.js-based rendering of hexagonal tiles and entities
- **Input Handling**: Mouse and keyboard interaction with the 3D scene
- **Map Definition**: JSON-based map configuration system

### Key Features

- **Flat-top hexagonal grids** using cubic coordinates
- **Generic cell properties** for custom game data
- **Entity management** with 3D model support
- **Dynamic map modification** (add/remove/update cells)
- **Built-in pathfinding** and movement range calculation
- **TypeScript-first** with full type safety

## Requirements

- Node.js >=18.0.0
- npm >=8.0.0
- Modern browser with WebGL support

## Tech Stack

- **TypeScript** for type safety
- **Three.js** for 3D rendering
- **Vite** for fast development and building
- **npm workspaces** for monorepo management

## License

MIT
