import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapIcon,
  MapPinIcon,
  HomeIcon,
  TruckIcon,
  ClockIcon,
  RouteIcon,
  PlusIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  CameraIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FireIcon,
  BanknotesIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';

export default function MappingTool() {
  const [mapType, setMapType] = useState('roadmap'); // roadmap, satellite, hybrid, terrain
  const [viewMode, setViewMode] = useState('properties'); // properties, routes, analytics, planning
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [routeStops, setRouteStops] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [routeActive, setRouteActive] = useState(false);
  const [currentStop, setCurrentStop] = useState(0);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    propertyType: 'all',
    status: 'all',
    priority: 'all',
    lastContact: 'all',
    radius: 10,
    center: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: -33.8151, lng: 151.0011 }); // Parramatta
  const [mapZoom, setMapZoom] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [routeStats, setRouteStats] = useState(null);
  const [doorKnockMode, setDoorKnockMode] = useState(false);
  const [customAddresses, setCustomAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [campaignData, setCampaignData] = useState(null);
  
  const mapRef = useRef(null);
  const googleMapsRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef([]);

  // Property status types
  const propertyStatuses = {
    available: { color: '#10B981', icon: HomeIcon, label: 'Available' },
    sold: { color: '#EF4444', icon: BanknotesIcon, label: 'Sold' },
    under_contract: { color: '#F59E0B', icon: ClockIcon, label: 'Under Contract' },
    new_listing: { color: '#8B5CF6', icon: StarIcon, label: 'New Listing' },
    price_reduced: { color: '#06B6D4', icon: ChartBarIcon, label: 'Price Reduced' },
    hot_property: { color: '#F97316', icon: FireIcon, label: 'Hot Property' },
    needs_attention: { color: '#EF4444', icon: ExclamationTriangleIcon, label: 'Needs Attention' }
  };

  // Load Google Maps
  useEffect(() => {
    if (!window.google) {
      loadGoogleMaps();
    } else {
      initializeMap();
    }
  }, []);

  // Load properties when filters change
  useEffect(() => {
    loadProperties();
  }, [filters]);

  // Filter properties when search query changes
  useEffect(() => {
    filterProperties();
  }, [properties, searchQuery, filters]);

  // Load Google Maps API
  const loadGoogleMaps = () => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry,directions`;
    script.onload = initializeMap;
    document.head.appendChild(script);
  };

  // Initialize Google Maps
  const initializeMap = () => {
    const mapOptions = {
      center: mapCenter,
      zoom: mapZoom,
      mapTypeId: mapType,
      styles: getMapStyles(),
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true
    };

    googleMapsRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#636B56',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });
    
    directionsRendererRef.current.setMap(googleMapsRef.current);

    // Add click listener for adding custom stops
    googleMapsRef.current.addListener('click', (event) => {
      if (doorKnockMode) {
        addCustomStop(event.latLng);
      }
    });

    // Load initial markers
    renderPropertyMarkers();
  };

  // Get custom map styles
  const getMapStyles = () => {
    return [
      {
        featureType: 'poi.business',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text',
        stylers: [{ visibility: 'off' }]
      }
    ];
  };

  // Load properties data
  const loadProperties = async () => {
    try {
      const response = await fetch('/api/properties/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      
      const data = await response.json();
      setProperties(data.properties || getSampleProperties());
    } catch (error) {
      console.error('Failed to load properties:', error);
      setProperties(getSampleProperties());
    }
  };

  // Get sample properties for demo
  const getSampleProperties = () => {
    return [
      {
        id: 'prop_001',
        address: '123 Oak Street, Parramatta NSW 2150',
        coordinates: { lat: -33.8151, lng: 151.0011 },
        price: 850000,
        type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        landSize: 650,
        status: 'available',
        priority: 'high',
        lastContact: '2024-01-10',
        ownerName: 'John Smith',
        ownerPhone: '+61412345678',
        estimatedValue: 920000,
        marketTrend: 'up',
        daysOnMarket: 12,
        viewings: 8,
        interest: 'high',
        notes: 'Very motivated seller, open to negotiation',
        images: ['/images/prop1.jpg'],
        features: ['garage', 'garden', 'renovated']
      },
      {
        id: 'prop_002',
        address: '456 Pine Avenue, Westmead NSW 2145',
        coordinates: { lat: -33.8073, lng: 150.9877 },
        price: 1200000,
        type: 'house',
        bedrooms: 4,
        bathrooms: 3,
        landSize: 800,
        status: 'new_listing',
        priority: 'high',
        lastContact: '2024-01-08',
        ownerName: 'Sarah Johnson',
        ownerPhone: '+61423456789',
        estimatedValue: 1150000,
        marketTrend: 'stable',
        daysOnMarket: 3,
        viewings: 15,
        interest: 'very_high',
        notes: 'Premium location, excellent condition',
        images: ['/images/prop2.jpg'],
        features: ['pool', 'double_garage', 'ensuite']
      },
      {
        id: 'prop_003',
        address: '789 Elm Court, Harris Park NSW 2150',
        coordinates: { lat: -33.8234, lng: 151.0011 },
        price: 750000,
        type: 'unit',
        bedrooms: 2,
        bathrooms: 1,
        landSize: 0,
        status: 'price_reduced',
        priority: 'medium',
        lastContact: '2023-12-15',
        ownerName: 'Mike Chen',
        ownerPhone: '+61434567890',
        estimatedValue: 780000,
        marketTrend: 'down',
        daysOnMarket: 45,
        viewings: 3,
        interest: 'low',
        notes: 'Price reduced by $50k, motivated seller',
        images: ['/images/prop3.jpg'],
        features: ['balcony', 'security', 'elevator']
      },
      {
        id: 'prop_004',
        address: '321 Maple Drive, Parramatta NSW 2150',
        coordinates: { lat: -33.8187, lng: 151.0045 },
        price: 950000,
        type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        landSize: 580,
        status: 'hot_property',
        priority: 'very_high',
        lastContact: '2024-01-14',
        ownerName: 'Lisa Brown',
        ownerPhone: '+61445678901',
        estimatedValue: 980000,
        marketTrend: 'up',
        daysOnMarket: 1,
        viewings: 25,
        interest: 'extreme',
        notes: 'Multiple offers expected, perfect condition',
        images: ['/images/prop4.jpg'],
        features: ['new_kitchen', 'solar', 'landscape']
      },
      // Add more sample properties for different areas
      ...generateAdditionalProperties()
    ];
  };

  // Generate additional properties for mapping demo
  const generateAdditionalProperties = () => {
    const additionalProps = [];
    const baseCoords = [
      { lat: -33.8100, lng: 150.9950 },
      { lat: -33.8200, lng: 151.0100 },
      { lat: -33.8050, lng: 151.0150 },
      { lat: -33.8300, lng: 150.9900 },
      { lat: -33.8150, lng: 150.9800 }
    ];

    baseCoords.forEach((coord, index) => {
      additionalProps.push({
        id: `prop_00${5 + index}`,
        address: `${100 + index * 50} Sample Street, Suburb NSW 2150`,
        coordinates: coord,
        price: 600000 + Math.random() * 600000,
        type: ['house', 'unit', 'townhouse'][Math.floor(Math.random() * 3)],
        bedrooms: Math.floor(Math.random() * 4) + 1,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        status: Object.keys(propertyStatuses)[Math.floor(Math.random() * Object.keys(propertyStatuses).length)],
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        lastContact: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ownerName: `Owner ${index + 5}`,
        ownerPhone: `+6141234567${index}`,
        estimatedValue: 600000 + Math.random() * 600000,
        marketTrend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
        daysOnMarket: Math.floor(Math.random() * 60),
        viewings: Math.floor(Math.random() * 20),
        interest: ['low', 'medium', 'high', 'very_high'][Math.floor(Math.random() * 4)]
      });
    });

    return additionalProps;
  };

  // Filter properties based on search and filters
  const filterProperties = () => {
    let filtered = [...properties];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prop =>
        prop.address.toLowerCase().includes(query) ||
        prop.ownerName.toLowerCase().includes(query) ||
        prop.notes?.toLowerCase().includes(query)
      );
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(prop => {
        if (max) {
          return prop.price >= min && prop.price <= max;
        } else {
          return prop.price >= min;
        }
      });
    }

    // Property type filter
    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(prop => prop.type === filters.propertyType);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(prop => prop.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(prop => prop.priority === filters.priority);
    }

    // Radius filter
    if (filters.center && filters.radius) {
      filtered = filtered.filter(prop => {
        const distance = calculateDistance(
          filters.center.lat,
          filters.center.lng,
          prop.coordinates.lat,
          prop.coordinates.lng
        );
        return distance <= filters.radius;
      });
    }

    setFilteredProperties(filtered);
    
    // Re-render markers
    if (googleMapsRef.current) {
      renderPropertyMarkers(filtered);
    }
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Render property markers on map
  const renderPropertyMarkers = (propertiesToRender = filteredProperties) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (!googleMapsRef.current) return;

    propertiesToRender.forEach(property => {
      const statusInfo = propertyStatuses[property.status];
      
      // Create custom marker
      const marker = new window.google.maps.Marker({
        position: property.coordinates,
        map: googleMapsRef.current,
        title: property.address,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: statusInfo.color,
          fillOpacity: 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: createMarkerInfoWindow(property)
      });

      // Add click listener
      marker.addListener('click', () => {
        // Close other info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow) m.infoWindow.close();
        });
        
        infoWindow.open(googleMapsRef.current, marker);
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });
  };

  // Create info window content for marker
  const createMarkerInfoWindow = (property) => {
    const statusInfo = propertyStatuses[property.status];
    
    return `
      <div style="max-width: 300px; font-family: system-ui;">
        <div style="border-bottom: 2px solid ${statusInfo.color}; padding-bottom: 10px; margin-bottom: 10px;">
          <h3 style="margin: 0; color: #333; font-size: 16px;">${property.address}</h3>
          <div style="display: flex; align-items: center; gap: 5px; margin-top: 5px;">
            <span style="background: ${statusInfo.color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
              ${statusInfo.label}
            </span>
            <span style="color: #666; font-size: 12px;">
              ${property.priority} priority
            </span>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div>
            <strong style="color: #636B56;">$${property.price.toLocaleString()}</strong>
            <div style="font-size: 12px; color: #666;">
              ${property.bedrooms}bd • ${property.bathrooms}ba
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #666;">
              ${property.daysOnMarket} days on market
            </div>
            <div style="font-size: 12px; color: #666;">
              ${property.viewings} viewings
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="font-size: 14px;">Owner:</strong> ${property.ownerName}<br>
          <strong style="font-size: 14px;">Phone:</strong> ${property.ownerPhone}
        </div>
        
        ${property.notes ? `
          <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; font-size: 12px; margin-bottom: 10px;">
            ${property.notes}
          </div>
        ` : ''}
        
        <div style="display: flex; gap: 5px;">
          <button onclick="addToRoute('${property.id}')" style="flex: 1; background: #636B56; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
            Add to Route
          </button>
          <button onclick="callOwner('${property.ownerPhone}')" style="background: #10B981; color: white; border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer;">
            📞
          </button>
          <button onclick="viewDetails('${property.id}')" style="background: #3B82F6; color: white; border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer;">
            👁️
          </button>
        </div>
      </div>
    `;
  };

  // Add property to route
  const addToRoute = useCallback((propertyId) => {
    const property = filteredProperties.find(p => p.id === propertyId);
    if (property && !routeStops.find(s => s.id === propertyId)) {
      setRouteStops(prev => [...prev, {
        id: propertyId,
        address: property.address,
        coordinates: property.coordinates,
        type: 'property',
        property: property,
        estimatedTime: 15, // minutes
        completed: false
      }]);
    }
  }, [filteredProperties, routeStops]);

  // Add custom address stop
  const addCustomStop = async (latLng) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: latLng });
      
      if (response.results[0]) {
        const address = response.results[0].formatted_address;
        const newStop = {
          id: `custom_${Date.now()}`,
          address: address,
          coordinates: { lat: latLng.lat(), lng: latLng.lng() },
          type: 'custom',
          estimatedTime: 10,
          completed: false
        };
        
        setRouteStops(prev => [...prev, newStop]);
        setCustomAddresses(prev => [...prev, newStop]);
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
  };

  // Optimize route using Google Directions API
  const optimizeRoute = async () => {
    if (routeStops.length < 2) {
      alert('Add at least 2 stops to optimize route');
      return;
    }

    setIsOptimizing(true);

    try {
      // Use Google Directions API for route optimization
      const waypoints = routeStops.slice(1, -1).map(stop => ({
        location: stop.coordinates,
        stopover: true
      }));

      const request = {
        origin: routeStops[0].coordinates,
        destination: routeStops[routeStops.length - 1].coordinates,
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      };

      const response = await directionsServiceRef.current.route(request);
      
      if (response.status === 'OK') {
        directionsRendererRef.current.setDirections(response);
        
        // Calculate route statistics
        const route = response.routes[0];
        const stats = {
          totalDistance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000, // km
          totalTime: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60, // minutes
          legs: route.legs.map((leg, index) => ({
            from: index === 0 ? 'Start' : routeStops[index].address,
            to: index === route.legs.length - 1 ? 'End' : routeStops[index + 1].address,
            distance: (leg.distance.value / 1000).toFixed(1),
            duration: Math.ceil(leg.duration.value / 60),
            instructions: leg.steps.map(step => step.instructions)
          })),
          optimizedOrder: response.routes[0].waypoint_order
        };

        setRouteStats(stats);
        setOptimizedRoute(response);
        
        // Reorder stops based on optimization
        if (stats.optimizedOrder && stats.optimizedOrder.length > 0) {
          const reorderedStops = [routeStops[0]]; // Start point
          stats.optimizedOrder.forEach(index => {
            reorderedStops.push(routeStops[index + 1]);
          });
          if (routeStops.length > waypoints.length + 1) {
            reorderedStops.push(routeStops[routeStops.length - 1]); // End point
          }
          setRouteStops(reorderedStops);
        }
      } else {
        throw new Error(`Directions request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Route optimization failed:', error);
      alert('Route optimization failed. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Start route navigation
  const startRouteNavigation = () => {
    if (!optimizedRoute) {
      alert('Please optimize route first');
      return;
    }

    // Open Google Maps with the optimized route
    const waypoints = routeStops.slice(1, -1).map(stop => 
      `${stop.coordinates.lat},${stop.coordinates.lng}`
    ).join('|');
    
    const origin = `${routeStops[0].coordinates.lat},${routeStops[0].coordinates.lng}`;
    const destination = `${routeStops[routeStops.length - 1].coordinates.lat},${routeStops[routeStops.length - 1].coordinates.lng}`;
    
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    
    window.open(googleMapsUrl, '_blank');
    setRouteActive(true);
  };

  // Add address manually
  const addManualAddress = async () => {
    if (!newAddress.trim()) return;

    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ address: newAddress });
      
      if (response.results[0]) {
        const location = response.results[0].geometry.location;
        const formattedAddress = response.results[0].formatted_address;
        
        const newStop = {
          id: `manual_${Date.now()}`,
          address: formattedAddress,
          coordinates: { lat: location.lat(), lng: location.lng() },
          type: 'manual',
          estimatedTime: 10,
          completed: false
        };
        
        setRouteStops(prev => [...prev, newStop]);
        setNewAddress('');
      } else {
        alert('Address not found. Please try a different address.');
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      alert('Failed to add address. Please try again.');
    }
  };

  // Remove stop from route
  const removeStop = (stopId) => {
    setRouteStops(prev => prev.filter(stop => stop.id !== stopId));
  };

  // Mark stop as completed
  const markStopCompleted = (stopId) => {
    setRouteStops(prev => prev.map(stop => 
      stop.id === stopId ? { ...stop, completed: true } : stop
    ));
  };

  // Export route to various formats
  const exportRoute = (format) => {
    const data = {
      route: routeStops,
      stats: routeStats,
      optimized: optimizedRoute,
      created: new Date().toISOString()
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      downloadFile(blob, 'route.json');
    } else if (format === 'csv') {
      const csv = generateCSV(routeStops);
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadFile(blob, 'route.csv');
    } else if (format === 'gpx') {
      const gpx = generateGPX(routeStops);
      const blob = new Blob([gpx], { type: 'application/gpx+xml' });
      downloadFile(blob, 'route.gpx');
    }
  };

  // Generate CSV from route data
  const generateCSV = (stops) => {
    const headers = ['Address', 'Latitude', 'Longitude', 'Type', 'Estimated Time', 'Completed'];
    const rows = stops.map(stop => [
      stop.address,
      stop.coordinates.lat,
      stop.coordinates.lng,
      stop.type,
      stop.estimatedTime,
      stop.completed
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // Generate GPX from route data
  const generateGPX = (stops) => {
    const waypoints = stops.map((stop, index) => `
      <wpt lat="${stop.coordinates.lat}" lon="${stop.coordinates.lng}">
        <name>${stop.address}</name>
        <desc>Stop ${index + 1}: ${stop.type}</desc>
      </wpt>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="VoiCRM">
  <metadata>
    <name>VoiCRM Route</name>
    <desc>Optimized route for property visits</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  ${waypoints}
</gpx>`;
  };

  // Download file
  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get property count by status
  const getPropertyStats = () => {
    const stats = {};
    Object.keys(propertyStatuses).forEach(status => {
      stats[status] = filteredProperties.filter(p => p.status === status).length;
    });
    return stats;
  };

  // Expose functions to global scope for info window buttons
  useEffect(() => {
    window.addToRoute = addToRoute;
    window.callOwner = (phone) => {
      window.open(`tel:${phone}`, '_self');
    };
    window.viewDetails = (propertyId) => {
      const property = filteredProperties.find(p => p.id === propertyId);
      if (property) {
        // Open property details modal or navigate to property page
        console.log('View property details:', property);
      }
    };
    
    return () => {
      delete window.addToRoute;
      delete window.callOwner;
      delete window.viewDetails;
    };
  }, [addToRoute, filteredProperties]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[#636B56] flex items-center gap-2">
            <MapIcon className="h-7 w-7" />
            Mapping & Route Tool
          </h1>
          
          {/* View Mode Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { id: 'properties', label: 'Properties', icon: HomeIcon },
              { id: 'routes', label: 'Routes', icon: RouteIcon },
              { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
              { id: 'planning', label: 'Planning', icon: CalendarIcon }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-colors ${
                  viewMode === mode.id
                    ? 'bg-white text-[#636B56] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <mode.icon className="h-4 w-4" />
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] w-64"
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </button>

          {/* Door Knock Mode */}
          <button
            onClick={() => setDoorKnockMode(!doorKnockMode)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              doorKnockMode 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <UserGroupIcon className="h-4 w-4" />
            Door Knock Mode
          </button>

          {/* Map Type Selector */}
          <select
            value={mapType}
            onChange={(e) => {
              setMapType(e.target.value);
              if (googleMapsRef.current) {
                googleMapsRef.current.setMapTypeId(e.target.value);
              }
            }}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="roadmap">Road Map</option>
            <option value="satellite">Satellite</option>
            <option value="hybrid">Hybrid</option>
            <option value="terrain">Terrain</option>
          </select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b p-4">
          <div className="grid grid-cols-6 gap-4">
            <select
              value={filters.priceRange}
              onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Prices</option>
              <option value="0-500000">Under $500k</option>
              <option value="500000-800000">$500k - $800k</option>
              <option value="800000-1200000">$800k - $1.2M</option>
              <option value="1200000-2000000">$1.2M - $2M</option>
              <option value="2000000-999999999">Above $2M</option>
            </select>

            <select
              value={filters.propertyType}
              onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="house">House</option>
              <option value="unit">Unit</option>
              <option value="townhouse">Townhouse</option>
              <option value="land">Land</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              {Object.entries(propertyStatuses).map(([key, status]) => (
                <option key={key} value={key}>{status.label}</option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Priority</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="very_high">Very High Priority</option>
            </select>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Radius:</label>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.radius}
                onChange={(e) => setFilters({...filters, radius: parseInt(e.target.value)})}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12">{filters.radius}km</span>
            </div>

            <button
              onClick={() => setFilters({
                priceRange: 'all',
                propertyType: 'all',
                status: 'all',
                priority: 'all',
                lastContact: 'all',
                radius: 10,
                center: null
              })}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r flex flex-col">
          {viewMode === 'properties' && (
            <>
              {/* Property Stats */}
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-800 mb-3">Property Overview</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(getPropertyStats()).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: propertyStatuses[status].color }}
                        />
                        <span className="text-gray-600">{propertyStatuses[status].label}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property List */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Properties ({filteredProperties.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredProperties.map(property => (
                      <div
                        key={property.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedProperties.includes(property.id) ? 'bg-blue-50 border-blue-500' : ''
                        }`}
                        onClick={() => {
                          // Pan map to property
                          if (googleMapsRef.current) {
                            googleMapsRef.current.panTo(property.coordinates);
                            googleMapsRef.current.setZoom(16);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {property.address}
                            </p>
                            <p className="text-sm text-green-600 font-semibold">
                              ${property.price.toLocaleString()}
                            </p>
                          </div>
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0 ml-2"
                            style={{ backgroundColor: propertyStatuses[property.status].color }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                          <span>{property.bedrooms}bd • {property.bathrooms}ba</span>
                          <span>{property.daysOnMarket} days</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-1 text-xs rounded ${
                            property.priority === 'high' ? 'bg-red-100 text-red-700' :
                            property.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {property.priority}
                          </span>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToRoute(property.id);
                            }}
                            className="px-2 py-1 text-xs bg-[#636B56] text-white rounded hover:bg-[#7a8365]"
                          >
                            Add to Route
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {viewMode === 'routes' && (
            <>
              {/* Route Controls */}
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-800 mb-3">Route Planning</h3>
                
                {/* Add Address Manually */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Enter address..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addManualAddress()}
                  />
                  <button
                    onClick={addManualAddress}
                    className="px-3 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365]"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>

                {doorKnockMode && (
                  <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      🎯 Door Knock Mode: Click on the map to add stops
                    </p>
                  </div>
                )}

                {/* Route Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={optimizeRoute}
                    disabled={routeStops.length < 2 || isOptimizing}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {isOptimizing ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <RouteIcon className="h-4 w-4" />
                        Optimize
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={startRouteNavigation}
                    disabled={!optimizedRoute}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    <PlayIcon className="h-4 w-4" />
                    Navigate
                  </button>
                </div>
              </div>

              {/* Route Stats */}
              {routeStats && (
                <div className="p-4 border-b bg-gray-50">
                  <h4 className="font-medium text-gray-800 mb-2">Route Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Distance:</span>
                      <span className="font-medium ml-2">{routeStats.totalDistance.toFixed(1)} km</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Time:</span>
                      <span className="font-medium ml-2">{Math.ceil(routeStats.totalTime)} min</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Stops:</span>
                      <span className="font-medium ml-2">{routeStops.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fuel Est:</span>
                      <span className="font-medium ml-2">{(routeStats.totalDistance * 0.1).toFixed(1)}L</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => exportRoute('csv')}
                      className="flex-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => exportRoute('gpx')}
                      className="flex-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Export GPX
                    </button>
                  </div>
                </div>
              )}

              {/* Route Stops */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Route Stops ({routeStops.length})
                  </h4>
                  
                  {routeStops.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MapPinIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No stops added</p>
                      <p className="text-sm">Add properties or addresses to create a route</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {routeStops.map((stop, index) => (
                        <div
                          key={stop.id}
                          className={`p-3 border rounded-lg ${
                            stop.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                stop.completed ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {index + 1}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {stop.address}
                                </p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    stop.type === 'property' ? 'bg-blue-100 text-blue-700' :
                                    stop.type === 'custom' ? 'bg-purple-100 text-purple-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {stop.type}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    ~{stop.estimatedTime} min
                                  </span>
                                </div>
                                
                                {stop.property && (
                                  <div className="mt-1 text-xs text-gray-600">
                                    {stop.property.ownerName} • {stop.property.ownerPhone}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {!stop.completed && (
                                <button
                                  onClick={() => markStopCompleted(stop.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  title="Mark as completed"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                              )}
                              
                              {stop.property && (
                                <button
                                  onClick={() => window.open(`tel:${stop.property.ownerPhone}`, '_self')}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Call owner"
                                >
                                  <PhoneIcon className="h-4 w-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => removeStop(stop.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Remove stop"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {viewMode === 'analytics' && (
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Map Analytics</h3>
              
              {/* Property Distribution */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Property Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(getPropertyStats()).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: propertyStatuses[status].color }}
                        />
                        <span className="text-sm text-gray-600">{propertyStatuses[status].label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 bg-gray-200 rounded-full"
                          style={{ width: '60px' }}
                        >
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${(count / filteredProperties.length) * 100}%`,
                              backgroundColor: propertyStatuses[status].color
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Insights */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Market Insights</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Price:</span>
                    <span className="font-medium">
                      ${Math.round(filteredProperties.reduce((sum, p) => sum + p.price, 0) / filteredProperties.length).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-medium">
                      ${(filteredProperties.reduce((sum, p) => sum + p.price, 0) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Days on Market:</span>
                    <span className="font-medium">
                      {Math.round(filteredProperties.reduce((sum, p) => sum + p.daysOnMarket, 0) / filteredProperties.length)} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">High Interest:</span>
                    <span className="font-medium">
                      {filteredProperties.filter(p => p.interest === 'high' || p.interest === 'very_high').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Route History */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Recent Routes</h4>
                <div className="text-sm text-gray-500">
                  No route history available
                </div>
              </div>
            </div>
          )}

          {viewMode === 'planning' && (
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Campaign Planning</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Type
                  </label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option value="door_knock">Door Knock Campaign</option>
                    <option value="flyer_drop">Flyer Drop</option>
                    <option value="market_update">Market Update Visits</option>
                    <option value="prospecting">Cold Prospecting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Area
                  </label>
                  <input
                    type="text"
                    placeholder="Enter suburb or postcode"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <button className="w-full px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365]">
                  Generate Campaign Route
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Map Overlay Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => {
                if (googleMapsRef.current) {
                  googleMapsRef.current.setCenter(mapCenter);
                  googleMapsRef.current.setZoom(12);
                }
              }}
              className="p-2 bg-white shadow-lg rounded-lg hover:bg-gray-50"
              title="Reset view"
            >
              <HomeIcon className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={() => {
                navigator.geolocation.getCurrentPosition((position) => {
                  const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  };
                  googleMapsRef.current.setCenter(userLocation);
                  googleMapsRef.current.setZoom(15);
                });
              }}
              className="p-2 bg-white shadow-lg rounded-lg hover:bg-gray-50"
              title="My location"
            >
              <MapPinIcon className="h-5 w-5 text-blue-600" />
            </button>
          </div>

          {/* Route Progress (when active) */}
          {routeActive && (
            <div className="absolute bottom-4 left-4 right-4 bg-white shadow-lg rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-800">Route in Progress</h4>
                <button
                  onClick={() => setRouteActive(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Stop {currentStop + 1} of {routeStops.length}</span>
                <span>{routeStops.filter(s => s.completed).length} completed</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-[#636B56] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(routeStops.filter(s => s.completed).length / routeStops.length) * 100}%` }}
                />
              </div>
              
              {currentStop < routeStops.length && (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">
                      {routeStops[currentStop]?.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      {routeStops[currentStop]?.property?.ownerName}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      markStopCompleted(routeStops[currentStop].id);
                      setCurrentStop(prev => prev + 1);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Complete Stop
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}