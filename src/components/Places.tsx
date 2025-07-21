import { useEffect, useState } from "react";
import type { AsyncState, Place, ErrorState } from "../types";
import { PlacesService } from "../services";
import { ApiServiceError } from "../services";

export function PlaceList() {
    const [placesState, setPlacesState] = useState<AsyncState<Place[]>>({
        data: null,
        loading: false,
        error: null,
    });

    const fetchPlaces = async () => {
      setPlacesState(prev => ({...prev, loading: true, error: null}));

      try {
        const places = await PlacesService.getPlaces();

        setPlacesState({data: places, loading: false, error: null})
      } catch (e) {
        let error: ErrorState = {
          type: "network",
          message: "Failed to load places.",
          retryable: true,
        };
        if (e instanceof(ApiServiceError)) {
          error.message = e.message;
          if (e.status in [400, 404]) {
            error.type = "validation"
            error.retryable = false;
          }
        }
        else {
          error.message = `An unexpected error occurred: ${e}`;
          error.type = "unknown"
        }
        setPlacesState({
          data: null,
          loading: false,
          error: error,
        })
      }
    }

    useEffect(() => { fetchPlaces(); }, [])
    
    if (placesState.loading) {
        // show spinning wheel
        return <div>Loading places..</div>
    }
    
    if (placesState.error) {
        return (
            <div>
            <p>Error: {placesState.error.message}</p>
            {placesState.error.retryable && (<button>Retry</button>)}
            </div>
        );
    }

    if (!placesState.data) {
      return <div>No places available..</div>
    }

    return (
      <ul>
        {placesState.data.map((place: Place) => (
          <li key={place.id}>{place.name}</li>
        ))}
      </ul>
    )
}