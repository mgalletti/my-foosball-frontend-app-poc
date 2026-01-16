import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChallengesService } from '../ChallengesService';
import { ApiServiceError } from '../api';
import type { Challenge, CreateChallengeRequest, Player, Place } from '../../types';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ChallengesService', () => {
  const mockPlayer: Player = {
    id: '1',
    name: 'Test Player',
    expertise: 'Intermediate',
    points: 100,
  };

  const mockPlace: Place = {
    id: '1',
    name: 'Test Place',
    coordinates: { lat: 40.7128, long: -74.006 },
    status: '1',
  };

  const mockChallenge: Challenge = {
    id: '1',
    name: 'Test Challenge',
    place: mockPlace,
    date: '2024-01-15',
    time: 'MORNING',
    status: 'Open',
    owner: mockPlayer,
    players: [mockPlayer],
  };

  const mockChallenges: Challenge[] = [
    mockChallenge,
    {
      ...mockChallenge,
      id: '2',
      name: 'Closed Challenge',
      status: 'Closed',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChallenges', () => {
    it('should fetch all challenges successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockChallenges),
      });

      const result = await ChallengesService.getChallenges();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/challenges',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result).toEqual(mockChallenges);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(ChallengesService.getChallenges()).rejects.toThrow(ApiServiceError);
    });

    it('should validate response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      });

      await expect(ChallengesService.getChallenges()).rejects.toThrow(ApiServiceError);
    });
  });

  describe('createChallenge', () => {
    const validRequest: CreateChallengeRequest = {
      name: 'New Challenge',
      placeId: '1',
      date: '2024-01-15',
      time: 'MORNING',
    };

    it('should create a challenge successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockChallenge),
      });

      const result = await ChallengesService.createChallenge(validRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/challenges',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validRequest),
        }),
      );
      expect(result).toEqual(mockChallenge);
    });

    it('should validate required fields', async () => {
      await expect(
        ChallengesService.createChallenge({
          ...validRequest,
          name: '',
        }),
      ).rejects.toThrow('Challenge name is required and must be a string');

      await expect(
        ChallengesService.createChallenge({
          ...validRequest,
          placeId: '',
        }),
      ).rejects.toThrow('Place ID is required and must be a string');

      await expect(
        ChallengesService.createChallenge({
          ...validRequest,
          date: '',
        }),
      ).rejects.toThrow('Date is required and must be a string');

      await expect(
        ChallengesService.createChallenge({
          ...validRequest,
          time: 'Invalid' as any,
        }),
      ).rejects.toThrow('Time is required and must be MORNING, AFTERNOON, or EVENING');
    });

    it('should handle server validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Invalid challenge data' }),
      });

      await expect(ChallengesService.createChallenge(validRequest)).rejects.toThrow(ApiServiceError);
    });
  });

  describe('joinChallenge', () => {
    it('should join a challenge successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockChallenge),
      });

      const result = await ChallengesService.joinChallenge('1', 'player1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/challenges/1/join',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId: '1', playerId: 'player1' }),
        }),
      );
      expect(result).toEqual(mockChallenge);
    });

    it('should validate required parameters', async () => {
      await expect(ChallengesService.joinChallenge('', 'player1')).rejects.toThrow(
        'Challenge ID is required and must be a string',
      );
      await expect(ChallengesService.joinChallenge('1', '')).rejects.toThrow(
        'Player ID is required and must be a string',
      );
    });
  });

  describe('getChallengesByPlace', () => {
    it('should filter challenges by place', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockChallenges),
      });

      const result = await ChallengesService.getChallengesByPlace('1');

      expect(result).toHaveLength(2);
      expect(result.every((c) => c.place.id === '1')).toBe(true);
    });

    it('should validate place ID', async () => {
      await expect(ChallengesService.getChallengesByPlace('')).rejects.toThrow(
        'Place ID is required and must be a string',
      );
    });
  });

  describe('getOpenChallenges', () => {
    it('should return only open challenges', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockChallenges),
      });

      const result = await ChallengesService.getOpenChallenges();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Open');
    });
  });

  describe('getChallengesByStatus', () => {
    it('should filter challenges by status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockChallenges),
      });

      const result = await ChallengesService.getChallengesByStatus('Closed');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Closed');
    });

    it('should validate status parameter', async () => {
      await expect(ChallengesService.getChallengesByStatus('Invalid' as any)).rejects.toThrow(
        'Status must be Open, Closed, or Completed',
      );
    });
  });

  describe('getChallengeById', () => {
    it('should fetch a challenge by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockChallenge),
      });

      const result = await ChallengesService.getChallengeById('1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/challenges/1',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result).toEqual(mockChallenge);
    });

    it('should validate challenge ID', async () => {
      await expect(ChallengesService.getChallengeById('')).rejects.toThrow(
        'Challenge ID is required and must be a string',
      );
    });
  });
});
