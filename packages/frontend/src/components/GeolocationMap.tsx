import { Icon, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Globe, MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useCurrentIP } from '../hooks/useIPAnalysis';
import { LoadingSpinner } from './LoadingSpinner';
import { Badge } from './ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

// Fix for default markers in React Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Create custom icon
const defaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to update map view when coordinates change
function MapUpdater({ center, zoom }: { center: LatLngTuple; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

interface GeolocationMapProps {
  className?: string | undefined;
  height?: string;
}

export function GeolocationMap({ className, height = '400px' }: GeolocationMapProps) {
  const { data: analysis, isLoading, error } = useCurrentIP();
  const mapRef = useRef<any>(null);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Geolocation Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8" style={{ height }}>
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-slate-600 dark:text-slate-400">Loading location data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Geolocation Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8" style={{ height }}>
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-600 dark:text-red-400" />
            <p className="font-medium text-red-600 dark:text-red-400">Map Loading Failed</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {error.message || 'Unable to load geolocation data'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const geolocation = analysis?.ip.geolocation;
  const primaryIP = analysis?.ip.primaryIP;

  if (!geolocation || !geolocation.latitude || !geolocation.longitude) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Geolocation Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8" style={{ height }}>
            <MapPin className="w-12 h-12 mx-auto mb-2 text-slate-400" />
            <p className="font-medium text-slate-600 dark:text-slate-400">Location Unavailable</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              No geolocation data available for this IP address
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const center: LatLngTuple = [geolocation.latitude, geolocation.longitude];
  const zoom = geolocation.accuracy === 'city' ? 10 : geolocation.accuracy === 'region' ? 6 : 4;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Geolocation Map
          </CardTitle>
          {geolocation.accuracy && (
            <Badge variant="info" size="sm">
              {geolocation.accuracy} level
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Location Summary */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {geolocation.country && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Country</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {geolocation.country}
                    {geolocation.countryCode && (
                      <span className="ml-2 text-sm text-slate-500">({geolocation.countryCode})</span>
                    )}
                  </p>
                </div>
              )}

              {geolocation.region && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Region</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{geolocation.region}</p>
                </div>
              )}

              {geolocation.city && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">City</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{geolocation.city}</p>
                </div>
              )}
            </div>

            <div className="mt-3">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Coordinates</p>
              <p className="font-mono text-sm text-slate-900 dark:text-slate-100">
                {geolocation.latitude.toFixed(6)}, {geolocation.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <MapContainer ref={mapRef} center={center} zoom={zoom} style={{ height, width: '100%' }} className="z-0">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapUpdater center={center} zoom={zoom} />

              <Marker position={center} icon={defaultIcon}>
                <Popup>
                  <div className="p-2">
                    <div className="font-semibold text-slate-900 mb-2">{primaryIP?.address}</div>

                    <div className="space-y-1 text-sm">
                      {geolocation.city && (
                        <div>
                          <span className="font-medium">City:</span> {geolocation.city}
                        </div>
                      )}

                      {geolocation.region && (
                        <div>
                          <span className="font-medium">Region:</span> {geolocation.region}
                        </div>
                      )}

                      {geolocation.country && (
                        <div>
                          <span className="font-medium">Country:</span> {geolocation.country}
                        </div>
                      )}

                      {geolocation.timezone && (
                        <div>
                          <span className="font-medium">Timezone:</span> {geolocation.timezone}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200">
                        <div className="font-mono text-xs text-slate-600">
                          {geolocation.latitude.toFixed(6)}, {geolocation.longitude.toFixed(6)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Accuracy: {geolocation.accuracy || 'Unknown'}
            </div>

            {geolocation.source && <div>Source: {geolocation.source}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
