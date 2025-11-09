import { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

interface GlobalMapProps {
  apiKey: string;
}

declare const google: any;

const GlobalMap = ({ apiKey }: GlobalMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initMap();
      };
      script.onerror = () => {
        setError('Failed to load Google Maps');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          mapTypeId: 'terrain',
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#1a3a2e' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#0a1f1a' }],
            },
          ],
        });

        // Climate hotspot markers
        const climateHotspots = [
          { lat: 43.6532, lng: -79.3832, name: 'Toronto', action: 'Reduced CO2 by 15%' },
          { lat: 44.6488, lng: -63.5752, name: 'Halifax', action: 'Clean energy adoption: 40%' },
          { lat: 49.2827, lng: -123.1207, name: 'Vancouver', action: 'Zero-waste initiative active' },
          { lat: 51.5074, lng: -0.1278, name: 'London', action: 'Green transport: 60% uptake' },
          { lat: 40.7128, lng: -74.0060, name: 'New York', action: 'Urban gardens: 500+ sites' },
          { lat: 35.6762, lng: 139.6503, name: 'Tokyo', action: 'Solar panels: 2M+ installations' },
          { lat: -33.8688, lng: 151.2093, name: 'Sydney', action: 'Water conservation: 30% saved' },
        ];

        climateHotspots.forEach((spot) => {
          const marker = new google.maps.Marker({
            position: { lat: spot.lat, lng: spot.lng },
            map: map,
            title: spot.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#00C9A7',
              fillOpacity: 0.8,
              strokeColor: '#FFD88D',
              strokeWeight: 2,
              scale: 8,
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; color: #1A5134; font-family: Inter, sans-serif;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${spot.name}</h3>
                <p style="margin: 0; font-size: 14px;">🌱 ${spot.action}</p>
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        });

        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize map');
        setIsLoading(false);
      }
    };

    loadGoogleMaps();
  }, [apiKey]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader className="animate-spin text-aqua" size={48} />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default GlobalMap;
