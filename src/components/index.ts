/**
 * @fileoverview Component exports for the Foosball Challenge App
 *
 * This module provides centralized exports for all components in the application.
 * Import components from this file to maintain clean import statements throughout the app.
 *
 * @version 1.0.0
 */

// Layout Components
export { default as MobileLayout } from './MobileLayout';

// Feature Components
export { default as PlacesList } from './PlacesList';
export { default as ChallengeForm } from './ChallengeForm';

// Re-export component types for convenience
export type { PlacesListProps } from './PlacesList';
export type { ChallengeFormProps } from './ChallengeForm';
export type { MobileLayoutProps } from './MobileLayout';
