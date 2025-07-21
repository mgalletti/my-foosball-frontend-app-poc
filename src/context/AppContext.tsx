/**
 * @fileoverview Global state management for the Foosball Challenge App
 * 
 * This module provides a centralized state management solution using React Context API
 * and useReducer hook. It manages the application's global state including places,
 * challenges, player information, loading states, errors, and navigation.
 * 
 * @version 1.0.0
 */

import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction, Player, Place, Challenge, ErrorState, NavigationState, AppSection } from '../types';

/**
 * Initial state for the application
 * 
 * Defines the default values for all global state properties:
 * - currentPlayer: No player logged in initially
 * - places: Empty array of foosball places
 * - challenges: Empty array of challenges
 * - loading: Not loading initially
 * - error: No errors initially
 * - navigation: Starts on home section
 */
const initialState: AppState = {
    currentPlayer: null,
    places: [],
    challenges: [],
    loading: false,
    error: null,
    navigation: {
        currentSection: 'home'
    }
};

/**
 * Reducer function for managing application state
 * 
 * Handles all state updates through dispatched actions. Each action type
 * corresponds to a specific state change operation. Most successful operations
 * automatically clear loading and error states.
 * 
 * @param state - Current application state
 * @param action - Action object containing type and payload
 * @returns New state object with applied changes
 */
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_PLACES':
            // Replace all places with new data from API
            return {
                ...state,
                places: action.payload,
                loading: false,
                error: null
            };

        case 'SET_CHALLENGES':
            // Replace all challenges with new data from API
            return {
                ...state,
                challenges: action.payload,
                loading: false,
                error: null
            };

        case 'SET_CURRENT_PLAYER':
            // Set the currently logged-in player
            return {
                ...state,
                currentPlayer: action.payload,
                loading: false,
                error: null
            };

        case 'ADD_CHALLENGE':
            // Add a new challenge to the existing list
            return {
                ...state,
                challenges: [...state.challenges, action.payload],
                loading: false,
                error: null
            };

        case 'JOIN_CHALLENGE':
            // Add a player to an existing challenge's player list
            return {
                ...state,
                challenges: state.challenges.map(challenge =>
                    challenge.id === action.payload.challengeId
                        ? {
                            ...challenge,
                            players: [...challenge.players, action.payload.player]
                        }
                        : challenge
                ),
                loading: false,
                error: null
            };

            case 'UPDATE_PLAYER':
                // Update the current logged-in player
                return {
                    ...state,
                    currentPlayer: action.payload,
                    loading: false,
                    error: null
                };
    
        case 'SET_LOADING':
            // Set loading state for UI feedback
            return {
                ...state,
                loading: action.payload
            };

        case 'SET_ERROR':
            // Set error state and clear loading
            return {
                ...state,
                error: action.payload,
                loading: false
            };

        case 'SET_NAVIGATION':
            // Update navigation state for section changes
            return {
                ...state,
                navigation: action.payload
            };

        default:
            return state;
    }
}

/**
 * Type definition for the application context
 * 
 * Contains the current state and dispatch function for triggering state updates
 */
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
}

/**
 * React Context for global application state
 * 
 * Provides access to the application state and dispatch function throughout
 * the component tree. Initialized as undefined to enforce proper provider usage.
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Props interface for the AppProvider component
 */
interface AppProviderProps {
    children: ReactNode;
}

/**
 * Application state provider component
 * 
 * Wraps the application with the global state context. Should be placed at the
 * root of the component tree to make state available to all child components.
 * 
 * @param children - Child components that will have access to the global state
 * @returns JSX element providing the application context
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AppProvider>
 *       <YourAppComponents />
 *     </AppProvider>
 *   );
 * }
 * ```
 */
export function AppProvider({ children }: AppProviderProps) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
}

/**
 * Hook to access the application context
 * 
 * Provides direct access to the global state and dispatch function.
 * Must be used within an AppProvider component.
 * 
 * @returns Object containing the current state and dispatch function
 * @throws Error if used outside of an AppProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { state, dispatch } = useAppContext();
 *   // Use state and dispatch...
 * }
 * ```
 */
export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}

// Custom hooks for specific state management

/**
 * Hook for managing places state
 * 
 * Provides access to the places array and functions to update it.
 * Includes loading and error states for UI feedback.
 * 
 * @returns Object containing places data and management functions
 * 
 * @example
 * ```tsx
 * function PlacesComponent() {
 *   const { places, setPlaces, loading, error } = usePlaces();
 *   
 *   const loadPlaces = async () => {
 *     const placesData = await fetchPlaces();
 *     setPlaces(placesData);
 *   };
 *   
 *   return (
 *     <div>
 *       {loading && <div>Loading places...</div>}
 *       {error && <div>Error: {error.message}</div>}
 *       {places.map(place => <div key={place.id}>{place.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlaces() {
    const { state, dispatch } = useAppContext();

    /**
     * Replace all places with new data
     * 
     * @param places - Array of place objects to set as the new places state
     */
    const setPlaces = (places: Place[]) => {
        dispatch({ type: 'SET_PLACES', payload: places });
    };

    return {
        places: state.places,
        setPlaces,
        loading: state.loading,
        error: state.error
    };
}

/**
 * Hook for managing challenges state
 * 
 * Provides access to the challenges array and functions to manage challenges.
 * Includes operations for setting, adding, and joining challenges.
 * 
 * @returns Object containing challenges data and management functions
 * 
 * @example
 * ```tsx
 * function ChallengesComponent() {
 *   const { challenges, setChallenges, addChallenge, joinChallenge, loading, error } = useChallenges();
 *   
 *   const handleCreateChallenge = (newChallenge: Challenge) => {
 *     addChallenge(newChallenge);
 *   };
 *   
 *   const handleJoinChallenge = (challengeId: string, player: Player) => {
 *     joinChallenge(challengeId, player);
 *   };
 *   
 *   return (
 *     <div>
 *       {loading && <div>Loading challenges...</div>}
 *       {error && <div>Error: {error.message}</div>}
 *       {challenges.map(challenge => (
 *         <div key={challenge.id}>
 *           {challenge.name} - {challenge.players.length} players
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useChallenges() {
    const { state, dispatch } = useAppContext();

    /**
     * Replace all challenges with new data
     * 
     * @param challenges - Array of challenge objects to set as the new challenges state
     */
    const setChallenges = (challenges: Challenge[]) => {
        dispatch({ type: 'SET_CHALLENGES', payload: challenges });
    };

    /**
     * Add a new challenge to the existing list
     * 
     * @param challenge - Challenge object to add to the state
     */
    const addChallenge = (challenge: Challenge) => {
        dispatch({ type: 'ADD_CHALLENGE', payload: challenge });
    };

    /**
     * Add a player to an existing challenge
     * 
     * @param challengeId - ID of the challenge to join
     * @param player - Player object to add to the challenge
     */
    const joinChallenge = (challengeId: string, player: Player) => {
        dispatch({ type: 'JOIN_CHALLENGE', payload: { challengeId, player } });
    };

    return {
        challenges: state.challenges,
        setChallenges,
        addChallenge,
        joinChallenge,
        loading: state.loading,
        error: state.error
    };
}

/**
 * Hook for managing player state
 * 
 * Provides access to the current player information and functions to manage it.
 * Includes operations for setting and updating the current player.
 * 
 * @returns Object containing player data and management functions
 * 
 * @example
 * ```tsx
 * function PlayerProfile() {
 *   const { currentPlayer, setCurrentPlayer, updatePlayer, loading, error } = usePlayer();
 *   
 *   const handleLogin = (player: Player) => {
 *     setCurrentPlayer(player);
 *   };
 *   
 *   const handleUpdateProfile = (updatedPlayer: Player) => {
 *     updatePlayer(updatedPlayer);
 *   };
 *   
 *   return (
 *     <div>
 *       {loading && <div>Loading...</div>}
 *       {error && <div>Error: {error.message}</div>}
 *       {currentPlayer ? (
 *         <div>Welcome, {currentPlayer.name}!</div>
 *       ) : (
 *         <div>Please log in</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlayer() {
    const { state, dispatch } = useAppContext();

    /**
     * Set the current player (typically used for login)
     * 
     * @param player - Player object to set as the current player
     */
    const setCurrentPlayer = (player: Player) => {
        dispatch({ type: 'SET_CURRENT_PLAYER', payload: player });
    };

    /**
     * Update the current player's information
     * 
     * @param player - Updated player object to replace the current player
     */
    const updatePlayer = (player: Player) => {
        dispatch({ type: 'UPDATE_PLAYER', payload: player });
    };

    return {
        currentPlayer: state.currentPlayer,
        setCurrentPlayer,
        updatePlayer,
        loading: state.loading,
        error: state.error
    };
}

/**
 * Hook for managing loading and error states
 * 
 * Provides access to global loading and error states with functions to manage them.
 * Useful for showing loading indicators and error messages throughout the application.
 * 
 * @returns Object containing loading/error states and management functions
 * 
 * @example
 * ```tsx
 * function DataComponent() {
 *   const { loading, error, setLoading, setError, clearError } = useAppState();
 *   
 *   const fetchData = async () => {
 *     setLoading(true);
 *     clearError();
 *     
 *     try {
 *       const data = await api.fetchData();
 *       // Process data...
 *     } catch (err) {
 *       setError({
 *         type: 'network',
 *         message: 'Failed to fetch data',
 *         retryable: true
 *       });
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       {loading && <div>Loading...</div>}
 *       {error && (
 *         <div>
 *           Error: {error.message}
 *           {error.retryable && <button onClick={fetchData}>Retry</button>}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAppState() {
    const { state, dispatch } = useAppContext();

    /**
     * Set the global loading state
     * 
     * @param loading - Boolean indicating whether the app is in a loading state
     */
    const setLoading = (loading: boolean) => {
        dispatch({ type: 'SET_LOADING', payload: loading });
    };

    /**
     * Set the global error state
     * 
     * @param error - Error state object or null to clear errors
     */
    const setError = (error: ErrorState | null) => {
        dispatch({ type: 'SET_ERROR', payload: error });
    };

    /**
     * Clear the current error state
     * 
     * Convenience function to set error to null
     */
    const clearError = () => {
        dispatch({ type: 'SET_ERROR', payload: null });
    };

    return {
        loading: state.loading,
        error: state.error,
        setLoading,
        setError,
        clearError
    };
}

/**
 * Hook for managing navigation state
 * 
 * Provides access to the current navigation section and functions to navigate
 * between different sections of the application. Maintains navigation history
 * to support back navigation.
 * 
 * @returns Object containing navigation state and management functions
 * 
 * @example
 * ```tsx
 * function NavigationComponent() {
 *   const { currentSection, previousSection, setCurrentSection, goBack } = useNavigation();
 *   
 *   const handleNavigateToProfile = () => {
 *     setCurrentSection('profile');
 *   };
 *   
 *   const handleGoBack = () => {
 *     goBack();
 *   };
 *   
 *   return (
 *     <div>
 *       <div>Current Section: {currentSection}</div>
 *       {previousSection && (
 *         <button onClick={handleGoBack}>
 *           Back to {previousSection}
 *         </button>
 *       )}
 *       <button onClick={handleNavigateToProfile}>
 *         Go to Profile
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNavigation() {
    const { state, dispatch } = useAppContext();

    /**
     * Navigate to a specific section of the application
     * 
     * Updates the current section and stores the previous section for back navigation.
     * 
     * @param section - The app section to navigate to ('home' | 'places' | 'challenges | 'profile'')
     */
    const setCurrentSection = (section: AppSection) => {
        const newNavigation: NavigationState = {
            currentSection: section,
            previousSection: state.navigation.currentSection
        };
        dispatch({ type: 'SET_NAVIGATION', payload: newNavigation });
    };

    /**
     * Navigate back to the previous section
     * 
     * Returns to the previous section if one exists, otherwise does nothing.
     * Clears the previous section after navigating back.
     */
    const goBack = () => {
        if (state.navigation.previousSection) {
            const newNavigation: NavigationState = {
                currentSection: state.navigation.previousSection,
                previousSection: undefined
            };
            dispatch({ type: 'SET_NAVIGATION', payload: newNavigation });
        }
    };

    return {
        currentSection: state.navigation.currentSection,
        previousSection: state.navigation.previousSection,
        setCurrentSection,
        goBack
    };
}