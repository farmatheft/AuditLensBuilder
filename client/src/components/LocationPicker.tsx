import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, X } from "lucide-react";
import type { Geolocation } from "@shared/schema";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

interface LocationPickerProps {
    initialLocation: Geolocation | null;
    onSave: (location: Geolocation) => void;
    onCancel: () => void;
}

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
}

function DraggableMarker({ position, setPosition }: { position: LatLng; setPosition: (pos: LatLng) => void }) {
    const markerRef = useRef<any>(null);

    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;
            if (marker != null) {
                setPosition(marker.getLatLng());
            }
        },
    };

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    );
}

function MapController({ center, zoom }: { center: LatLng; zoom: number }) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);

    return null;
}

function LocationMarker({ position, setPosition }: { position: LatLng; setPosition: (pos: LatLng) => void }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return <DraggableMarker position={position} setPosition={setPosition} />;
}

export function LocationPicker({ initialLocation, onSave, onCancel }: LocationPickerProps) {
    const defaultCenter = initialLocation
        ? new LatLng(initialLocation.latitude, initialLocation.longitude)
        : new LatLng(50.4501, 30.5234); // Kyiv as default

    const [position, setPosition] = useState<LatLng>(defaultCenter);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [mapCenter, setMapCenter] = useState<LatLng>(defaultCenter);
    const [mapZoom, setMapZoom] = useState(initialLocation ? 15 : 10);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (result: SearchResult) => {
        const newPos = new LatLng(parseFloat(result.lat), parseFloat(result.lon));
        setPosition(newPos);
        setMapCenter(newPos);
        setMapZoom(15);
        setSearchResults([]);
        setSearchQuery("");
    };

    const handleSave = () => {
        onSave({
            latitude: position.lat,
            longitude: position.lng,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Select Location</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCancel}
                        className="text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Search address..."
                            className="bg-gray-900 border-gray-700 text-white pr-10"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <Button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSearching ? "Searching..." : "Search"}
                    </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="mt-2 bg-gray-900 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                        {searchResults.map((result, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectResult(result)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-800 border-b border-gray-700 last:border-b-0 text-sm text-white"
                            >
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <span>{result.display_name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="flex-1 relative">
                <MapContainer
                    center={defaultCenter}
                    zoom={mapZoom}
                    className="w-full h-full"
                    zoomControl={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                    <MapController center={mapCenter} zoom={mapZoom} />
                </MapContainer>

                {/* Coordinates Display */}
                <div className="absolute bottom-20 left-4 right-4 bg-black/80 backdrop-blur-sm text-white px-4 py-3 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2 text-sm font-mono">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span>
                            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-gray-800 border-t border-gray-700 p-4 flex gap-3">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 border-gray-600 text-white hover:bg-gray-700"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                    Save Location
                </Button>
            </div>
        </div>
    );
}
