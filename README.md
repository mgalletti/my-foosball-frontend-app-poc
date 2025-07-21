# Foosball Challenge App

A mobile-first React application that connects foosball players by helping them discover locations, create challenges, and participate in games with other players.

## Features

### 🗺️ Interactive Map
- View all available foosball places on an interactive map
- Tap on locations to see details and create challenges
- Mobile-optimized touch controls for zooming and panning

### 🏓 Challenge Management
- Create challenges at any available foosball location
- Join existing open challenges from other players
- Set preferred times (Morning, Afternoon, Evening) for games

### 👤 Player Profiles
- Track your expertise level (Novice, Intermediate, Expert)
- Accumulate points through challenge participation
- View other players' profiles and skill levels

### 📱 Mobile-First Design
- Responsive layout optimized for mobile devices
- Bottom navigation for easy thumb access
- Touch-friendly interface elements

## Tech Stack

- **React 19** with TypeScript for type-safe development
- **Material-UI (MUI) v7** for consistent mobile UI components
- **React-Leaflet** for interactive map functionality
- **Vite** for fast development and optimized builds
- **Vitest** for comprehensive testing

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests with Vitest
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run release` - Run all scripts (test, lint, build)

## API Integration

The app integrates with REST APIs for:
- `/places` - Foosball location data
- `/challenges` - Challenge management
- `/players` - Player profiles and statistics

## Project Structure

```
src/
├── components/          # React components
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── test/               # Test utilities and setup
└── assets/             # Static assets
```

---

## Development Template Information

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
