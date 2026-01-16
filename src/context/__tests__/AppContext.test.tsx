/**
 * @fileoverview Test suite for AppContext global state management
 * 
 * This test suite validates the functionality of the global state management system
 * including the AppProvider, useAppContext hook, and all custom hooks for managing
 * places, challenges, players, loading states, errors, and navigation.
 * 
 * @version 1.0.0
 */

import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { AppProvider, useAppContext, usePlaces, useChallenges, usePlayer, useAppState, useNavigation } from '../AppContext';
import type { Player, Place, Challenge, ErrorState } from '../../types';

/**
 * Mock data for testing
 * 
 * These mock objects represent typical data structures used throughout the application
 * and provide consistent test data for all test cases.
 */

/** Mock player object for testing player-related functionality */
const mockPlayer: Player = {
    id: '1',
    name: 'John Doe',
    expertise: 'Intermediate',
    points: 100
};

/** Mock place object for testing places-related functionality */
const mockPlace: Place = {
    id: '1',
    name: 'Test Place',
    coordinates: { lat: 40.7128, long: -74.0060 },
    status: '1'
};

/** Mock challenge object for testing challenges-related functionality */
const mockChallenge: Challenge = {
    id: '1',
    name: 'Test Challenge',
    place: mockPlace,
    date: '2024-01-15',
    time: 'MORNING',
    status: 'Open',
    owner: mockPlayer,
    players: [mockPlayer]
};

/** Mock error state object for testing error handling functionality */
const mockError: ErrorState = {
    type: 'network',
    message: 'Network error',
    retryable: true
};

/**
 * Test wrapper component that provides AppContext to child components
 * 
 * This wrapper is used in all tests to ensure hooks have access to the AppProvider
 * context, simulating the real application environment.
 * 
 * @param children - Child components that need access to the AppContext
 * @returns JSX element wrapping children with AppProvider
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AppProvider>{children}</AppProvider>
);

describe('AppContext', () => {
    describe('useAppContext', () => {
        it('should throw error when used outside provider', () => {
            // Test that the hook throws an error when used outside provider
            expect(() => {
                renderHook(() => useAppContext());
            }).toThrow('useAppContext must be used within an AppProvider');
        });

        it('should provide context when used within provider', () => {
            const { result } = renderHook(() => useAppContext(), {
                wrapper: TestWrapper
            });

            expect(result.current.state).toBeDefined();
            expect(result.current.dispatch).toBeDefined();
            expect(result.current.state.currentPlayer).toBeNull();
            expect(result.current.state.places).toEqual([]);
            expect(result.current.state.challenges).toEqual([]);
            expect(result.current.state.loading).toBe(false);
            expect(result.current.state.error).toBeNull();
            expect(result.current.state.navigation.currentSection).toBe('home');
        });
    });

    describe('usePlaces', () => {
        it('should return initial places state', () => {
            const { result } = renderHook(() => usePlaces(), {
                wrapper: TestWrapper
            });

            expect(result.current.places).toEqual([]);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should set places', () => {
            const { result } = renderHook(() => usePlaces(), {
                wrapper: TestWrapper
            });

            act(() => {
                result.current.setPlaces([mockPlace]);
            });

            expect(result.current.places).toEqual([mockPlace]);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });
    });

    describe('useChallenges', () => {
        it('should return initial challenges state', () => {
            const { result } = renderHook(() => useChallenges(), {
                wrapper: TestWrapper
            });

            expect(result.current.challenges).toEqual([]);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should set challenges', () => {
            const { result } = renderHook(() => useChallenges(), {
                wrapper: TestWrapper
            });

            act(() => {
                result.current.setChallenges([mockChallenge]);
            });

            expect(result.current.challenges).toEqual([mockChallenge]);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should add challenge', () => {
            const { result } = renderHook(() => useChallenges(), {
                wrapper: TestWrapper
            });

            act(() => {
                result.current.addChallenge(mockChallenge);
            });

            expect(result.current.challenges).toEqual([mockChallenge]);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should join challenge', () => {
            const newPlayer: Player = {
                id: '2',
                name: 'Jane Doe',
                expertise: 'Expert',
                points: 200
            };

            const { result } = renderHook(() => useChallenges(), {
                wrapper: TestWrapper
            });

            // First add a challenge
            act(() => {
                result.current.addChallenge(mockChallenge);
            });

            // Then join the challenge
            act(() => {
                result.current.joinChallenge('1', newPlayer);
            });

            expect(result.current.challenges[0].players).toHaveLength(2);
            expect(result.current.challenges[0].players).toContain(newPlayer);
        });
    });

    describe('usePlayer', () => {
        it('should return initial player state', () => {
            const { result } = renderHook(() => usePlayer(), {
                wrapper: TestWrapper
            });

            expect(result.current.currentPlayer).toBeNull();
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should set current player', () => {
            const { result } = renderHook(() => usePlayer(), {
                wrapper: TestWrapper
            });

            act(() => {
                result.current.setCurrentPlayer(mockPlayer);
            });

            expect(result.current.currentPlayer).toEqual(mockPlayer);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should update player', () => {
            const { result } = renderHook(() => usePlayer(), {
                wrapper: TestWrapper
            });

            const updatedPlayer = { ...mockPlayer, points: 150 };

            act(() => {
                result.current.setCurrentPlayer(mockPlayer);
            });

            act(() => {
                result.current.updatePlayer(updatedPlayer);
            });

            expect(result.current.currentPlayer).toEqual(updatedPlayer);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });
    });

    describe('useAppState', () => {
        it('should return initial app state', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: TestWrapper
            });

            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should set loading state', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: TestWrapper
            });

            act(() => {
                result.current.setLoading(true);
            });

            expect(result.current.loading).toBe(true);
        });

        it('should set error state', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: TestWrapper
            });

            act(() => {
                result.current.setError(mockError);
            });

            expect(result.current.error).toEqual(mockError);
            expect(result.current.loading).toBe(false);
        });

        it('should clear error state', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: TestWrapper
            });

            act(() => {
                result.current.setError(mockError);
            });

            act(() => {
                result.current.clearError();
            });

            expect(result.current.error).toBeNull();
        });
    });

    describe('useNavigation', () => {
        it('should return initial navigation state', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: TestWrapper
            });

            expect(result.current.currentSection).toBe('home');
            expect(result.current.previousSection).toBeUndefined();
        });

        it('should set current section', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: TestWrapper
            });

            act(() => {
                result.current.setCurrentSection('profile');
            });

            expect(result.current.currentSection).toBe('profile');
            expect(result.current.previousSection).toBe('home');
        });

        it('should go back to previous section', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: TestWrapper
            });

            act(() => {
                result.current.setCurrentSection('profile');
            });

            act(() => {
                result.current.goBack();
            });

            expect(result.current.currentSection).toBe('home');
            expect(result.current.previousSection).toBeUndefined();
        });

        it('should not go back when no previous section', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: TestWrapper
            });

            act(() => {
                result.current.goBack();
            });

            expect(result.current.currentSection).toBe('home');
            expect(result.current.previousSection).toBeUndefined();
        });
    });

    describe('AppProvider', () => {
        it('should render children', () => {
            const TestComponent = () => <div>Test Content</div>;

            const { getByText } = render(
                <AppProvider>
                    <TestComponent />
                </AppProvider>
            );

            expect(getByText('Test Content')).toBeInTheDocument();
        });
    });

    describe('Reducer edge cases', () => {
        it('should handle joining non-existent challenge', () => {
            const { result } = renderHook(() => useChallenges(), {
                wrapper: TestWrapper
            });

            const newPlayer: Player = {
                id: '2',
                name: 'Jane Doe',
                expertise: 'Expert',
                points: 200
            };

            act(() => {
                result.current.addChallenge(mockChallenge);
            });

            act(() => {
                result.current.joinChallenge('non-existent', newPlayer);
            });

            // Should not modify existing challenge
            expect(result.current.challenges[0].players).toHaveLength(1);
            expect(result.current.challenges[0].players[0]).toEqual(mockPlayer);
        });

        it('should handle multiple state updates correctly', () => {
            const { result } = renderHook(() => useAppContext(), {
                wrapper: TestWrapper
            });

            act(() => {
                result.current.dispatch({ type: 'SET_LOADING', payload: true });
                result.current.dispatch({ type: 'SET_PLACES', payload: [mockPlace] });
                result.current.dispatch({ type: 'SET_CURRENT_PLAYER', payload: mockPlayer });
            });

            expect(result.current.state.loading).toBe(false); // Should be false after SET_PLACES
            expect(result.current.state.places).toEqual([mockPlace]);
            expect(result.current.state.currentPlayer).toEqual(mockPlayer);
        });
    });
});