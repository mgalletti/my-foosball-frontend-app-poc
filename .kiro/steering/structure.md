# Project Structure & Architecture

## Folder Organization

```
src/
├── components/          # React components with co-located tests
│   ├── __tests__/      # Component test files
│   └── index.ts        # Centralized component exports
├── context/            # React Context providers
│   └── __tests__/      # Context test files
├── services/           # API service layer
│   ├── __tests__/      # Service test files
│   ├── api.ts          # Base API utilities
│   └── index.ts        # Service exports
├── types/              # TypeScript type definitions
│   └── index.ts        # All type exports
├── test/               # Test utilities and setup
│   └── setup.ts        # Vitest configuration
├── assets/             # Static assets (images, icons)
├── main.tsx            # Application entry point
├── index.css           # Global styles
└── vite-env.d.ts       # Vite type definitions
```

## Architecture Patterns

### Component Structure
- Components are organized by feature/domain
- Each component has comprehensive JSDoc documentation
- Props interfaces are explicitly defined and exported
- Co-located test files in `__tests__` directories
- Centralized exports through `index.ts` files

### Service Layer
- API services follow a consistent pattern with base utilities
- Services handle error transformation and type safety
- Each service focuses on a single domain (Places, Challenges, Players)
- Mock implementations available for testing

### Type System
- All types centralized in `src/types/index.ts`
- Comprehensive interfaces for API requests/responses
- Form validation types and error handling types
- Component prop types exported for reuse

### State Management
- React Context for global application state
- Local component state for UI-specific data
- Reducer pattern for complex state updates
- Error boundaries for graceful error handling

## Naming Conventions

### Files & Directories
- Components: PascalCase (e.g., `ChallengeForm.tsx`)
- Services: PascalCase with Service suffix (e.g., `ChallengesService.ts`)
- Types: camelCase for files, PascalCase for interfaces
- Tests: Component/service name + `.test.tsx/.test.ts`

### Code Conventions
- Interfaces: PascalCase with descriptive names
- Props interfaces: ComponentName + Props (e.g., `ChallengeFormProps`)
- Enums/Union types: PascalCase for types, camelCase for values
- Functions: camelCase with descriptive verbs
- Constants: UPPER_SNAKE_CASE for module-level constants

## Import/Export Patterns

### Centralized Exports
- Use `index.ts` files for clean import statements
- Export both components and their prop types
- Re-export commonly used types from services

### Import Organization
1. React and external libraries
2. Internal components and services
3. Types and interfaces
4. Relative imports

## Mobile-First Considerations

### Component Design
- Touch-friendly interface elements (minimum 44px touch targets)
- Bottom navigation for thumb accessibility
- Dialog components with mobile-optimized spacing
- Responsive breakpoints using MUI's system

### Performance
- Lazy loading for non-critical components
- Optimized bundle splitting with Vite
- Efficient re-rendering with React.memo and useCallback
- Minimal external dependencies

## Testing Strategy

### Test Organization
- Unit tests co-located with components/services
- Integration tests for complex user flows
- Test utilities in dedicated `test/` directory
- Mock services for isolated component testing

### Testing Patterns
- React Testing Library for component tests
- User-centric testing approach (testing behavior, not implementation)
- Comprehensive error scenario testing
- API service mocking for reliable tests