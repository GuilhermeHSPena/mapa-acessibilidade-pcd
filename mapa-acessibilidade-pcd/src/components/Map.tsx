import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useState, useRef, useCallback, useEffect } from "react";

type MapProps = {
  center: { lat: number; lng: number };
  zoom: number;
  onPlaceClick: (placeId: string) => void;
};

const containerStyle = {
  width: "100%",
  height: "100%",
};

export default function Map({ center, zoom, onPlaceClick }: MapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [selectedMarker, setSelectedMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyOptions, setNearbyOptions] = useState<google.maps.places.PlaceResult[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng || !mapRef.current) return;

    // Fecha o modal atual antes de buscar novo
    setShowOptions(false);
    setNearbyOptions([]);

    const service = new window.google.maps.places.PlacesService(mapRef.current);

    const request: google.maps.places.PlaceSearchRequest = {
      location: event.latLng,
      radius: 50,
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        const filtered = results.filter((r) =>
          r.types?.some((type) => ["museum", "establishment", "point_of_interest"].includes(type))
        );

        const optionsToShow = filtered.length > 0 ? filtered.slice(0, 5) : results.slice(0, 5);

        setTimeout(() => {
          setNearbyOptions(optionsToShow);
          setShowOptions(true);
        }, 100);
      }
    });
  };

  const handleSelectPlace = (place: google.maps.places.PlaceResult) => {
    if (place.place_id && place.geometry?.location) {
      const loc = place.geometry.location;
      setSelectedMarker({ lat: loc.lat(), lng: loc.lng() });
      onPlaceClick(place.place_id);
      setShowOptions(false);
      setNearbyOptions([]);
    }
  };

  // Detectar clique fora do modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowOptions(false);
        setNearbyOptions([]);
      }
    };

    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptions]);

  if (!isLoaded) return <div>Carregando mapa...</div>;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onClick={handleMapClick}
      >
        {selectedMarker && <Marker position={selectedMarker} />}
      </GoogleMap>

      {showOptions && nearbyOptions.length > 0 && (
        <div
          ref={modalRef}
          className="absolute top-4 left-4 bg-white rounded shadow p-4 z-50 w-[300px] max-h-[500px] overflow-y-auto"
        >
          <h3 className="font-bold mb-2 text-black">Qual local você quis clicar?</h3>
          <ul className="space-y-2">
            {nearbyOptions.map((place, idx) => (
              <li
                key={idx}
                className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                onClick={() => handleSelectPlace(place)}
              >
                <p className="font-medium text-black">{place.name}</p>
                <p className="text-sm text-gray-600">{place.vicinity}</p>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              setShowOptions(false);
              setNearbyOptions([]);
            }}
            className="mt-4 text-sm text-blue-600 underline"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
