import { useEffect, useState } from 'react';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

type Coordinates = {
    lat: number;
    long: number;
}

type Place = {
  id: string;
  name: string;
  coordinates: Coordinates;
  status: number;
};

export default function MapView() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/places')
      .then(res => res.json())
      .then(data => setPlaces(data.places))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ height: '100vh', width: '100vw', p: 1, bgcolor: 'background.default' }}>
      <Paper elevation={3} sx={{ mb: 2, p: 1, textAlign: 'center' }}>
        <Typography variant="h6">Find Places</Typography>
      </Paper>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <MapContainer
          center={[places[0]?.coordinates.lat || 0, places[0]?.coordinates.long || 0]}
          zoom={13}
          style={{ height: '80vh', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {places.map(place => (
            <Marker key={place.id} position={[place.coordinates.lat, place.coordinates.long]}>
              <Popup>{place.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </Box>
  );
}