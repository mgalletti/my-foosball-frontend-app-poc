// Core Data Models

export type TimeSlot = 'Morning' | 'Afternoon' | 'Evening';

export interface Place {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    long: number;
  };
  status: string; // "1" for active
}

export interface Player {
  id: string;
  name: string;
  expertise: 'Novice' | 'Intermediate' | 'Expert';
  points: number;
}

export interface Challenge {
  id: string;
  name: string;
  place: Place;
  date: string; // ISO date string
  time: TimeSlot; // "Morning" | "Afternoon" | "Evening"
  status: 'Open' | 'Closed' | 'Completed';
  owner: Player;
  players: Player[];
}

// API Request/Response Types

export interface CreateChallengeRequest {
  name: string;
  placeId: string;
  date: string;
  time: TimeSlot;
}

export interface JoinChallengeRequest {
  challengeId: string;
  playerId: string;
}

export interface UpdatePlayerRequest {
  name?: string;
  expertise?: 'Novice' | 'Intermediate' | 'Expert';
  points?: number;
}

export interface GetPlacesResponse {
  places: Place[];
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Error Handling Types

export interface ErrorState {
  type: 'network' | 'validation' | 'server' | 'unknown';
  message: string;
  retryable: boolean;
  field?: string; // For validation errors
}

export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, string>;
}

// Navigation State Types

export type AppSection = 'home' | 'profile' | 'places' | 'challenges';

export interface NavigationState {
  currentSection: AppSection;
  previousSection?: AppSection;
}

// State Management Types

export interface AppState {
  currentPlayer: Player | null;
  places: Place[];
  challenges: Challenge[];
  loading: boolean;
  error: ErrorState | null;
  navigation: NavigationState;
}

export type AppAction =
  | { type: 'SET_PLACES'; payload: Place[] }
  | { type: 'SET_CHALLENGES'; payload: Challenge[] }
  | { type: 'SET_CURRENT_PLAYER'; payload: Player }
  | { type: 'ADD_CHALLENGE'; payload: Challenge }
  | { type: 'JOIN_CHALLENGE'; payload: { challengeId: string; player: Player } }
  | { type: 'UPDATE_PLAYER'; payload: Player }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: ErrorState | null }
  | { type: 'SET_NAVIGATION'; payload: NavigationState };

// Form Validation Types

export interface ValidationRule<T> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
}

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

export interface FormState<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: { [K in keyof T]?: boolean };
  isValid: boolean;
  isSubmitting: boolean;
}

// Challenge Form Types

export interface ChallengeFormData {
  name: string;
  date: string;
  time: TimeSlot;
}

export interface PlayerProfileFormData {
  name: string;
  expertise: 'Novice' | 'Intermediate' | 'Expert';
}

// Utility Types

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ErrorState | null;
}

// Component Props Types

export interface MapViewProps {
  places: Place[];
  onPlaceSelect: (place: Place) => void;
  selectedPlace?: Place;
}

export interface PlacesListProps {
  places: Place[];
  onPlaceSelect: (place: Place) => void;
}

export interface ChallengesListProps {
  challenges: Challenge[];
  onJoinChallenge: (challengeId: string) => void;
  onCreateChallenge: () => void;
}

export interface ChallengeFormProps {
  place: Place;
  onSubmit: (challenge: CreateChallengeRequest) => void;
  onCancel: () => void;
}

export interface PlayerProfileProps {
  player: Player;
  onUpdateProfile: (updates: Partial<Player>) => void;
}

export interface MobileLayoutProps {
  children: React.ReactNode;
  currentSection: AppSection;
}
