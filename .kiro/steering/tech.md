# Technology Stack

## Core Technologies

- **React 19** with TypeScript for type-safe development
- **Material-UI (MUI) v7** for consistent mobile UI components
- **React-Leaflet** for interactive map functionality
- **Vite** for fast development and optimized builds
- **Vitest** for comprehensive testing with jsdom environment

## Build System

- **Vite** as the primary build tool and dev server
- **TypeScript** with strict mode enabled
- **ESLint** with TypeScript and React plugins for code quality
- **Prettier** for consistent code formatting

## Common Commands

```bash
# Development
npm run dev              # Start development server (http://localhost:5173)
npm run type-check       # Run TypeScript type checking

# Testing
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:ui          # Run tests with UI

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
npm run format           # Format code with Prettier

# Build & Deploy
npm run build            # Build for production (TypeScript + Vite)
npm run preview          # Preview production build
npm run release          # Full release pipeline (clean, test, format, lint, build)

# Maintenance
npm run clean            # Remove dist folder
npm run clean:hard       # Remove node_modules and dist
npm run clean:reset      # Full reset and reinstall
```

## Configuration

- **TypeScript**: Strict mode with ES2022 target, bundler module resolution
- **ESLint**: TypeScript-ESLint with React hooks and refresh plugins
- **Prettier**: 120 character line width, single quotes, trailing commas
- **Vitest**: jsdom environment with global test utilities

## Key Dependencies

- **UI**: @mui/material, @mui/icons-material, @emotion/react, @emotion/styled
- **Maps**: leaflet, react-leaflet, @types/leaflet
- **Icons**: lucide-react
- **Testing**: @testing-library/react, @testing-library/jest-dom, @testing-library/user-event