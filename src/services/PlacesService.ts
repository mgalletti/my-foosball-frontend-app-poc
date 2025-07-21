import type { Place, GetPlacesResponse } from '../types';
import { BaseApiService } from './api';

// TODO: Re-enable lint violation when logging in catches is properly implemented
/* eslint-disable no-useless-catch */

// Type guards for response validation
const isPlaces = (data: any): data is GetPlacesResponse => {
  return (
    typeof data === 'object' &&
    data !== null &&
    data.places !== null &&
    data.places instanceof Array &&
    (data.places.length > 0 ? isPlace(data.places[0]) : true)
  );
};

const isPlace = (data: any): data is Place => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.coordinates === 'object' &&
    typeof data.coordinates.lat === 'number' &&
    typeof data.coordinates.long === 'number' &&
    typeof data.status === 'string'
  );
};

export class PlacesService extends BaseApiService {
  /**
   * Fetch all available places from the /places endpoint
   * @returns Promise<Place[]> Array of places
   * @throws ApiServiceError on network or server errors
   */
  static async getPlaces(): Promise<Place[]> {
    try {
      const data = await this.request<GetPlacesResponse>('/places');
      const response = this.validateResponse(data, isPlaces);
      return response.places;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch a specific place by ID
   * @param id - The place ID to fetch
   * @returns Promise<Place> The place object
   * @throws ApiServiceError on network, server, or not found errors
   */
  static async getPlaceById(id: string): Promise<Place> {
    if (!id || typeof id !== 'string') {
      throw new Error('Place ID is required and must be a string');
    }

    try {
      const data = await this.request<Place>(`/places/${encodeURIComponent(id)}`);
      return this.validateResponse(data, isPlace);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get places filtered by status
   * @param status - The status to filter by (e.g., "1" for active)
   * @returns Promise<Place[]> Array of filtered places
   */
  static async getPlacesByStatus(status: string): Promise<Place[]> {
    if (!status || typeof status !== 'string') {
      throw new Error('Status is required and must be a string');
    }

    try {
      const places = await this.getPlaces();
      return places.filter((place) => place.status === status);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get active places (status = "1")
   * @returns Promise<Place[]> Array of active places
   */
  static async getActivePlaces(): Promise<Place[]> {
    return this.getPlacesByStatus('1');
  }
}
