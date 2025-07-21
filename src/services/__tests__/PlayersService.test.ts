import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayersService } from '../PlayersService';
import { ApiServiceError } from '../api';
import type { Player, UpdatePlayerRequest } from '../../types';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('PlayersService', () => {
  const mockPlayer: Player = {
    id: '1',
    name: 'Test Player',
    expertise: 'Intermediate',
    points: 100,
  };

  const mockPlayers: Player[] = [
    mockPlayer,
    {
      id: '2',
      name: 'Expert Player',
      expertise: 'Expert',
      points: 500,
    },
    {
      id: '3',
      name: 'Novice Player',
      expertise: 'Novice',
      points: 10,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentPlayer', () => {
    it('should fetch current player successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayer),
      });

      const result = await PlayersService.getCurrentPlayer();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/players/me',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result).toEqual(mockPlayer);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(PlayersService.getCurrentPlayer()).rejects.toThrow(ApiServiceError);
    });

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      await expect(PlayersService.getCurrentPlayer()).rejects.toThrow(ApiServiceError);
    });

    it('should validate response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      });

      await expect(PlayersService.getCurrentPlayer()).rejects.toThrow(ApiServiceError);
    });
  });

  describe('updatePlayer', () => {
    const validUpdate: UpdatePlayerRequest = {
      name: 'Updated Player',
      expertise: 'Expert',
      points: 200,
    };

    it('should update player successfully', async () => {
      const updatedPlayer = { ...mockPlayer, ...validUpdate };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedPlayer),
      });

      const result = await PlayersService.updatePlayer(validUpdate);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/players/me',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validUpdate),
        }),
      );
      expect(result).toEqual(updatedPlayer);
    });

    it('should validate name field', async () => {
      await expect(
        PlayersService.updatePlayer({
          name: '',
        }),
      ).rejects.toThrow('Name must be a non-empty string');

      await expect(
        PlayersService.updatePlayer({
          name: '   ',
        }),
      ).rejects.toThrow('Name must be a non-empty string');

      await expect(
        PlayersService.updatePlayer({
          name: 123 as any,
        }),
      ).rejects.toThrow('Name must be a non-empty string');
    });

    it('should validate expertise field', async () => {
      await expect(
        PlayersService.updatePlayer({
          expertise: 'Invalid' as any,
        }),
      ).rejects.toThrow('Expertise must be Novice, Intermediate, or Expert');
    });

    it('should validate points field', async () => {
      await expect(
        PlayersService.updatePlayer({
          points: -10,
        }),
      ).rejects.toThrow('Points must be a non-negative number');

      await expect(
        PlayersService.updatePlayer({
          points: 'invalid' as any,
        }),
      ).rejects.toThrow('Points must be a non-negative number');
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'New Name' };
      const updatedPlayer = { ...mockPlayer, name: 'New Name' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedPlayer),
      });

      const result = await PlayersService.updatePlayer(partialUpdate);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/players/me',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(partialUpdate),
        }),
      );
      expect(result).toEqual(updatedPlayer);
    });

    it('should handle server validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Invalid player data' }),
      });

      await expect(PlayersService.updatePlayer(validUpdate)).rejects.toThrow(ApiServiceError);
    });
  });

  describe('getPlayerById', () => {
    it('should fetch a player by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayer),
      });

      const result = await PlayersService.getPlayerById('1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/players/1',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result).toEqual(mockPlayer);
    });

    it('should validate player ID', async () => {
      await expect(PlayersService.getPlayerById('')).rejects.toThrow('Player ID is required and must be a string');
      await expect(PlayersService.getPlayerById(null as any)).rejects.toThrow(
        'Player ID is required and must be a string',
      );
    });

    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Player not found' }),
      });

      await expect(PlayersService.getPlayerById('999')).rejects.toThrow(ApiServiceError);
    });
  });

  describe('getPlayersByExpertise', () => {
    it('should fetch players by expertise level', async () => {
      const expertPlayers = mockPlayers.filter((p) => p.expertise === 'Expert');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(expertPlayers),
      });

      const result = await PlayersService.getPlayersByExpertise('Expert');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/players?expertise=Expert',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result).toEqual(expertPlayers);
    });

    it('should validate expertise parameter', async () => {
      await expect(PlayersService.getPlayersByExpertise('Invalid' as any)).rejects.toThrow(
        'Expertise must be Novice, Intermediate, or Expert',
      );
      await expect(PlayersService.getPlayersByExpertise('' as any)).rejects.toThrow(
        'Expertise must be Novice, Intermediate, or Expert',
      );
    });

    it('should validate response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      });

      await expect(PlayersService.getPlayersByExpertise('Expert')).rejects.toThrow(
        'Invalid response format from server',
      );
    });
  });

  describe('getTopPlayers', () => {
    it('should fetch top players with default limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });

      const result = await PlayersService.getTopPlayers();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/players/top?limit=10',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result).toEqual(mockPlayers);
    });

    it('should fetch top players with custom limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayers.slice(0, 5)),
      });

      const result = await PlayersService.getTopPlayers(5);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/players/top?limit=5',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result).toHaveLength(3); // mockPlayers has only 3 items
    });

    it('should validate limit parameter', async () => {
      await expect(PlayersService.getTopPlayers(0)).rejects.toThrow('Limit must be a positive number');
      await expect(PlayersService.getTopPlayers(-1)).rejects.toThrow('Limit must be a positive number');
      await expect(PlayersService.getTopPlayers('invalid' as any)).rejects.toThrow('Limit must be a positive number');
    });

    it('should validate response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      });

      await expect(PlayersService.getTopPlayers()).rejects.toThrow('Invalid response format from server');
    });
  });

  describe('updatePlayerPoints', () => {
    it('should update player points successfully', async () => {
      const updatedPlayer = { ...mockPlayer, points: 150 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedPlayer),
      });

      const result = await PlayersService.updatePlayerPoints('1', 50);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/players/1/points',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points: 50 }),
        }),
      );
      expect(result).toEqual(updatedPlayer);
    });

    it('should validate parameters', async () => {
      await expect(PlayersService.updatePlayerPoints('', 50)).rejects.toThrow(
        'Player ID is required and must be a string',
      );
      await expect(PlayersService.updatePlayerPoints('1', 'invalid' as any)).rejects.toThrow(
        'Points to add must be a number',
      );
    });

    it('should handle negative points', async () => {
      const updatedPlayer = { ...mockPlayer, points: 50 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedPlayer),
      });

      const result = await PlayersService.updatePlayerPoints('1', -50);

      expect(result).toEqual(updatedPlayer);
    });
  });

  describe('updatePlayerExpertise', () => {
    it('should update player expertise successfully', async () => {
      const updatedPlayer = { ...mockPlayer, expertise: 'Expert' as const };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedPlayer),
      });

      const result = await PlayersService.updatePlayerExpertise('1', 'Expert');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/players/1/expertise',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expertise: 'Expert' }),
        }),
      );
      expect(result).toEqual(updatedPlayer);
    });

    it('should validate parameters', async () => {
      await expect(PlayersService.updatePlayerExpertise('', 'Expert')).rejects.toThrow(
        'Player ID is required and must be a string',
      );
      await expect(PlayersService.updatePlayerExpertise('1', 'Invalid' as any)).rejects.toThrow(
        'Expertise must be Novice, Intermediate, or Expert',
      );
    });
  });
});
