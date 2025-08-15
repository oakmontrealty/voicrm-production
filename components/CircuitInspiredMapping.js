import { useState, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, DirectionsRenderer, Polygon, Circle } from '@react-google-maps/api';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];

export default function CircuitInspiredMapping() {
  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [mapMode, setMapMode] = useState('properties'); // 'properties', 'route', 'analytics'
  const [filterCriteria, setFilterCriteria] = useState({
    priceRange: [0, 10000000],
    propertyType: 'all',
    bedrooms: 'any',
    bathrooms: 'any',
    marketStatus: 'all'
  });
  const [routeMetrics, setRouteMetrics] = useState({
    totalDistance: 0,
    totalTime: 0,
    fuelCost: 0,
    efficiency: 0,
    doorKnocks: 0
  });
  const [heatmapData, setHeatmapData] = useState([]);
  const [drawingMode, setDrawingMode] = useState(null);
  const [territoryPolygons, setTerritoryPolygons] = useState([]);

  const supabase = createClientComponentClient();
  const directionsService = useRef(null);
  const placesService = useRef(null);
  const geocoder = useRef(null);

  // Circuit App inspired design
  const mapStyles = [
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#193341' }]
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#2c5f2d' }, { lightness: -37 }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#000000' }, { lightness: -53 }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#2c5f2d' }, { lightness: -36 }]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d69e2e' }]
    }
  ];

  useEffect(() => {
    getCurrentLocation();
    loadProperties();
    initializeServices();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Sydney, Australia
          setCurrentLocation({ lat: -33.8688, lng: 151.2093 });
        }
      );
    }
  };

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_interests (contact_id),
          contacts (name, phone, email)
        `)
        .limit(500);

      if (error) throw error;

      const propertiesWithMarkers = data?.map(property => ({
        ...property,
        position: {
          lat: parseFloat(property.latitude) || 0,
          lng: parseFloat(property.longitude) || 0
        },
        icon: getPropertyIcon(property)
      })) || [];

      setProperties(propertiesWithMarkers);
    } catch (error) {
      console.error('Error loading properties:', error);
      // Load mock data for demo
      setProperties(generateMockProperties());
    }
  };

  const generateMockProperties = () => {
    const mockData = [];
    const center = currentLocation || { lat: -33.8688, lng: 151.2093 };
    
    for (let i = 0; i < 50; i++) {
      mockData.push({
        id: `mock_${i}`,
        address: `${Math.floor(Math.random() * 999)} Mock Street, Sydney`,
        price: Math.floor(Math.random() * 5000000) + 300000,
        bedrooms: Math.floor(Math.random() * 5) + 1,
        bathrooms: Math.floor(Math.random() * 4) + 1,
        sqft: Math.floor(Math.random() * 3000) + 800,
        property_type: ['house', 'apartment', 'townhouse'][Math.floor(Math.random() * 3)],
        market_status: ['for_sale', 'sold', 'off_market'][Math.floor(Math.random() * 3)],
        position: {
          lat: center.lat + (Math.random() - 0.5) * 0.1,
          lng: center.lng + (Math.random() - 0.5) * 0.1
        },
        icon: getPropertyIcon({ market_status: ['for_sale', 'sold', 'off_market'][Math.floor(Math.random() * 3)] })
      });
    }
    
    return mockData;
  };

  const getPropertyIcon = (property) => {
    const baseUrl = 'data:image/svg+xml;base64,';
    let color = '#3B82F6'; // Default blue
    
    switch (property.market_status) {
      case 'for_sale':
        color = '#10B981'; // Green
        break;
      case 'sold':
        color = '#EF4444'; // Red
        break;
      case 'off_market':
        color = '#F59E0B'; // Yellow
        break;
      default:
        color = '#6B7280'; // Gray
    }

    const svg = `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <path d="M12 14h8v6h-8v-6z" fill="white"/>
        <path d="M10 16l6-4 6 4" stroke="white" stroke-width="2" fill="none"/>
      </svg>
    `;

    return {
      url: baseUrl + btoa(svg),
      scaledSize: { width: 32, height: 32 }
    };
  };

  const initializeServices = () => {
    if (window.google) {
      directionsService.current = new window.google.maps.DirectionsService();
      geocoder.current = new window.google.maps.Geocoder();
    }
  };

  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
    if (window.google) {
      placesService.current = new window.google.maps.places.PlacesService(mapInstance);
      initializeServices();
    }
  };

  const addToRoute = (property) => {
    setRouteStops(prev => [...prev, {
      ...property,
      stopNumber: prev.length + 1,
      estimatedTime: 15, // 15 minutes per stop
      priority: 'medium'
    }]);
  };

  const removeFromRoute = (propertyId) => {
    setRouteStops(prev => prev.filter(stop => stop.id !== propertyId));
  };

  const optimizeRoute = async () => {
    if (routeStops.length < 2) return;

    try {
      // Create waypoints for optimization
      const waypoints = routeStops.slice(1, -1).map(stop => ({
        location: stop.position,
        stopover: true
      }));

      const request = {
        origin: routeStops[0].position,
        destination: routeStops[routeStops.length - 1].position,
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      };

      directionsService.current.route(request, (result, status) => {
        if (status === 'OK') {
          setOptimizedRoute(result);
          calculateRouteMetrics(result);
        } else {
          console.error('Directions request failed due to ' + status);
        }
      });
    } catch (error) {
      console.error('Error optimizing route:', error);
    }
  };

  const calculateRouteMetrics = (directionsResult) => {
    let totalDistance = 0;
    let totalTime = 0;

    directionsResult.routes[0].legs.forEach(leg => {
      totalDistance += leg.distance.value;
      totalTime += leg.duration.value;
    });

    const distanceKm = totalDistance / 1000;
    const timeHours = totalTime / 3600;
    const fuelCost = distanceKm * 0.12 * 1.50; // Assuming 12L/100km at $1.50/L
    const efficiency = routeStops.length / timeHours; // Stops per hour

    setRouteMetrics({
      totalDistance: distanceKm,
      totalTime: timeHours,
      fuelCost: fuelCost,
      efficiency: efficiency,
      doorKnocks: routeStops.length
    });
  };

  const exportRouteToGoogleMaps = () => {
    if (routeStops.length === 0) return;

    const baseUrl = 'https://www.google.com/maps/dir/';
    const stops = routeStops.map(stop => 
      `${stop.position.lat},${stop.position.lng}`
    ).join('/');
    
    const url = `${baseUrl}${stops}`;
    window.open(url, '_blank');
  };

  const createTerritory = (polygon) => {
    const territory = {
      id: `territory_${Date.now()}`,
      name: `Territory ${territoryPolygons.length + 1}`,
      coordinates: polygon.getPath().getArray().map(coord => ({
        lat: coord.lat(),
        lng: coord.lng()
      })),
      area: window.google.maps.geometry.spherical.computeArea(polygon.getPath()),
      properties: []
    };

    setTerritoryPolygons(prev => [...prev, territory]);
    
    // Find properties within this territory
    const propertiesInTerritory = properties.filter(property => 
      window.google.maps.geometry.poly.containsLocation(
        new window.google.maps.LatLng(property.position.lat, property.position.lng),
        polygon
      )
    );

    console.log(`Territory created with ${propertiesInTerritory.length} properties`);
  };

  const generateHeatmapData = () => {
    // Generate heatmap data based on property density and values
    const heatmapPoints = properties.map(property => ({
      location: new window.google.maps.LatLng(property.position.lat, property.position.lng),
      weight: property.price / 100000 // Weight based on price
    }));

    setHeatmapData(heatmapPoints);
  };

  const filterProperties = () => {
    return properties.filter(property => {
      const { priceRange, propertyType, bedrooms, bathrooms, marketStatus } = filterCriteria;
      
      return (
        property.price >= priceRange[0] && 
        property.price <= priceRange[1] &&
        (propertyType === 'all' || property.property_type === propertyType) &&
        (bedrooms === 'any' || property.bedrooms >= parseInt(bedrooms)) &&
        (bathrooms === 'any' || property.bathrooms >= parseInt(bathrooms)) &&
        (marketStatus === 'all' || property.market_status === marketStatus)
      );
    });
  };

  const PropertyInfoWindow = ({ property, onClose }) => (
    <InfoWindow 
      position={property.position} 
      onCloseClick={onClose}
    >
      <div className="max-w-sm">
        <div className="font-bold text-lg mb-2">{property.address}</div>
        <div className="text-2xl font-bold text-green-600 mb-2">
          ${property.price?.toLocaleString()}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
          <div><strong>{property.bedrooms}</strong> bed</div>
          <div><strong>{property.bathrooms}</strong> bath</div>
          <div><strong>{property.sqft}</strong> sqft</div>
        </div>
        <div className="mb-3">
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            property.market_status === 'for_sale' ? 'bg-green-100 text-green-800' :
            property.market_status === 'sold' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {property.market_status?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => addToRoute(property)}
            disabled={routeStops.find(stop => stop.id === property.id)}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            Add to Route
          </button>
          <button
            onClick={() => window.open(`/properties/${property.id}`, '_blank')}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
          >
            Details
          </button>
        </div>
      </div>
    </InfoWindow>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Circuit-Style Header */}
      <div className="bg-black p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="mr-3">🗺️</span>
            VoiCRM Mapping
            <span className="ml-3 text-xs bg-blue-500 px-2 py-1 rounded">
              Circuit Inspired
            </span>
          </h1>
          
          <div className="flex items-center space-x-4">
            <div className="flex rounded-lg overflow-hidden">
              {['properties', 'route', 'analytics'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setMapMode(mode)}
                  className={`px-4 py-2 text-sm font-medium ${
                    mapMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Side Panel - Circuit Style */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          {mapMode === 'properties' && (
            <div className="p-4 space-y-4">
              <h3 className="font-bold text-lg">Property Filters</h3>
              
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Price Range</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filterCriteria.priceRange[0]}
                    onChange={(e) => setFilterCriteria(prev => ({
                      ...prev,
                      priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]]
                    }))}
                    className="flex-1 p-2 bg-gray-700 rounded border border-gray-600"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filterCriteria.priceRange[1]}
                    onChange={(e) => setFilterCriteria(prev => ({
                      ...prev,
                      priceRange: [prev.priceRange[0], parseInt(e.target.value) || 10000000]
                    }))}
                    className="flex-1 p-2 bg-gray-700 rounded border border-gray-600"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Property Type</label>
                <select
                  value={filterCriteria.propertyType}
                  onChange={(e) => setFilterCriteria(prev => ({
                    ...prev,
                    propertyType: e.target.value
                  }))}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                >
                  <option value="all">All Types</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="land">Land</option>
                </select>
              </div>

              {/* Market Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Market Status</label>
                <select
                  value={filterCriteria.marketStatus}
                  onChange={(e) => setFilterCriteria(prev => ({
                    ...prev,
                    marketStatus: e.target.value
                  }))}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                >
                  <option value="all">All Status</option>
                  <option value="for_sale">For Sale</option>
                  <option value="sold">Recently Sold</option>
                  <option value="off_market">Off Market</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-600">
                <div className="text-sm text-gray-400 mb-2">
                  Showing {filterProperties().length} of {properties.length} properties
                </div>
                <button
                  onClick={generateHeatmapData}
                  className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-medium"
                >
                  Generate Heatmap
                </button>
              </div>
            </div>
          )}

          {mapMode === 'route' && (
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Route Planning</h3>
                <span className="text-sm text-gray-400">{routeStops.length} stops</span>
              </div>

              {/* Route Metrics */}
              {routeMetrics.totalDistance > 0 && (
                <div className="bg-gray-700 p-4 rounded">
                  <h4 className="font-medium mb-2">Route Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Distance: {routeMetrics.totalDistance.toFixed(1)} km</div>
                    <div>Time: {(routeMetrics.totalTime * 60).toFixed(0)} min</div>
                    <div>Fuel Cost: ${routeMetrics.fuelCost.toFixed(2)}</div>
                    <div>Efficiency: {routeMetrics.efficiency.toFixed(1)}/hr</div>
                  </div>
                </div>
              )}

              {/* Route Actions */}
              <div className="space-y-2">
                <button
                  onClick={optimizeRoute}
                  disabled={routeStops.length < 2}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium"
                >
                  Optimize Route
                </button>
                <button
                  onClick={exportRouteToGoogleMaps}
                  disabled={routeStops.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium"
                >
                  Open in Google Maps
                </button>
              </div>

              {/* Route Stops */}
              <div className="space-y-2">
                <h4 className="font-medium">Route Stops</h4>
                {routeStops.map((stop, index) => (
                  <div key={stop.id} className="bg-gray-700 p-3 rounded flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center mr-2">
                          {index + 1}
                        </span>
                        <span className="font-medium text-sm">{stop.address}</span>
                      </div>
                      <div className="text-xs text-gray-400 ml-8">
                        ${stop.price?.toLocaleString()} • Est. {stop.estimatedTime}min
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromRoute(stop.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mapMode === 'analytics' && (
            <div className="p-4 space-y-4">
              <h3 className="font-bold text-lg">Territory Analytics</h3>
              
              <div className="space-y-3">
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-sm text-gray-400">Total Properties</div>
                  <div className="text-2xl font-bold">{properties.length}</div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-sm text-gray-400">Average Price</div>
                  <div className="text-2xl font-bold">
                    ${properties.length > 0 ? Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length).toLocaleString() : '0'}
                  </div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-sm text-gray-400">Territories</div>
                  <div className="text-2xl font-bold">{territoryPolygons.length}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Drawing Tools</h4>
                <button
                  onClick={() => setDrawingMode('polygon')}
                  className={`w-full px-4 py-2 rounded font-medium ${
                    drawingMode === 'polygon' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  Draw Territory
                </button>
                <button
                  onClick={() => setDrawingMode('circle')}
                  className={`w-full px-4 py-2 rounded font-medium ${
                    drawingMode === 'circle' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  Draw Circle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1">
          <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}
            libraries={GOOGLE_MAPS_LIBRARIES}
          >
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={currentLocation}
              zoom={13}
              onLoad={onMapLoad}
              options={{
                styles: mapStyles,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: true,
                scaleControl: true,
                streetViewControl: true,
                rotateControl: true,
                fullscreenControl: true
              }}
            >
              {/* Current Location */}
              {currentLocation && (
                <Marker
                  position={currentLocation}
                  icon={{
                    url: 'data:image/svg+xml;base64,' + btoa(`
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                      </svg>
                    `),
                    scaledSize: { width: 24, height: 24 }
                  }}
                />
              )}

              {/* Property Markers */}
              {filterProperties().map(property => (
                <Marker
                  key={property.id}
                  position={property.position}
                  icon={property.icon}
                  onClick={() => setSelectedProperty(property)}
                />
              ))}

              {/* Selected Property Info Window */}
              {selectedProperty && (
                <PropertyInfoWindow
                  property={selectedProperty}
                  onClose={() => setSelectedProperty(null)}
                />
              )}

              {/* Optimized Route */}
              {optimizedRoute && (
                <DirectionsRenderer
                  directions={optimizedRoute}
                  options={{
                    polylineOptions: {
                      strokeColor: '#3B82F6',
                      strokeWeight: 4,
                      strokeOpacity: 0.8
                    },
                    markerOptions: {
                      icon: {
                        url: 'data:image/svg+xml;base64,' + btoa(`
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="12" fill="#10B981" stroke="white" stroke-width="2"/>
                            <path d="M12 16l3 3 6-6" stroke="white" stroke-width="2" fill="none"/>
                          </svg>
                        `),
                        scaledSize: { width: 32, height: 32 }
                      }
                    }
                  }}
                />
              )}

              {/* Territory Polygons */}
              {territoryPolygons.map(territory => (
                <Polygon
                  key={territory.id}
                  paths={territory.coordinates}
                  options={{
                    fillColor: '#3B82F6',
                    fillOpacity: 0.2,
                    strokeColor: '#3B82F6',
                    strokeWeight: 2
                  }}
                />
              ))}
            </GoogleMap>
          </LoadScript>
        </div>
      </div>
    </div>
  );
}