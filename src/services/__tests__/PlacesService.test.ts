import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlacesService } from '../PlacesService';
import { ApiServiceError } from '../api';
import type { Place } from '../../types';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('PlacesService', () => {
  const mockPlace: Place = {
    id: '1',
    name: 'Test Place',
    coordinates: { lat: 40.7128, long: -74.006 },
    status: '1',
  };

  const mockPlaces: Place[] = [
    mockPlace,
    {
      id: '2',
      name: 'Another Place',
      coordinates: { lat: 41.8781, long: -87.6298 },
      status: '0',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlaces', () => {
    it('should fetch all places successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ places: mockPlaces }),
      });

      const result = await PlacesService.getPlaces();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/places',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result).toEqual(mockPlaces);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(PlacesService.getPlaces()).rejects.toThrow(ApiServiceError);
    });

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      await expect(PlacesService.getPlaces()).rejects.toThrow(ApiServiceError);
    });

    it('should validate response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      });

      await expect(PlacesService.getPlaces()).rejects.toThrow(ApiServiceError);
    });
  });

  describe('getPlaceById', () => {
    it('should fetch a place by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlace),
      });

      const result = await PlacesService.getPlaceById('1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/places/1',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result).toEqual(mockPlace);
    });

    it('should throw error for invalid ID', async () => {
      await expect(PlacesService.getPlaceById('')).rejects.toThrow('Place ID is required and must be a string');
      await expect(PlacesService.getPlaceById(null as any)).rejects.toThrow(
        'Place ID is required and must be a string',
      );
    });

    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Place not found' }),
      });

      await expect(PlacesService.getPlaceById('999')).rejects.toThrow(ApiServiceError);
    });
  });

  describe('getPlacesByStatus', () => {
    it('should filter places by status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ places: mockPlaces }),
      });

      const result = await PlacesService.getPlacesByStatus('1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPlace);
    });

    it('should throw error for invalid status', async () => {
      await expect(PlacesService.getPlacesByStatus('')).rejects.toThrow('Status is required and must be a string');
      await expect(PlacesService.getPlacesByStatus(null as any)).rejects.toThrow(
        'Status is required and must be a string',
      );
    });
  });

  describe('getActivePlaces', () => {
    it('should return only active places', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ places: mockPlaces }),
      });

      const result = await PlacesService.getActivePlaces();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('1');
    });
  });
});
