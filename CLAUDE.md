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

# Lint, format
npm run lint
npm run format # okay to auto-apply format
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

You may always review `notes/hexboard-system-brief.md` for the current state of
the game architecture.
