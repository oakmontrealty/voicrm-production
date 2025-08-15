import { MapPinIcon, HomeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function PropertyGrid({ properties, onPropertyClick }) {
  const getStatusBadge = (status) => {
    const statusStyles = {
      'Available': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Sold': 'bg-red-100 text-red-800',
      'Rented': 'bg-blue-100 text-blue-800',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <div
          key={property.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
          onClick={() => onPropertyClick(property)}
        >
          <div className="h-48 bg-gray-300 relative">
            {property.imageUrl ? (
              <img 
                src={property.imageUrl} 
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <HomeIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
            <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${getStatusBadge(property.status)}`}>
              {property.status}
            </span>
          </div>

          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
            
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPinIcon className="h-4 w-4 mr-1" />
              {property.address}
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center text-xl font-bold text-indigo-600">
                <CurrencyDollarIcon className="h-5 w-5 mr-1" />
                {property.price?.toLocaleString()}
              </div>
              <span className="text-sm text-gray-500">{property.type}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
              <div className="text-center">
                <span className="block font-semibold">{property.bedrooms}</span>
                <span className="text-xs">Beds</span>
              </div>
              <div className="text-center">
                <span className="block font-semibold">{property.bathrooms}</span>
                <span className="text-xs">Baths</span>
              </div>
              <div className="text-center">
                <span className="block font-semibold">{property.sqft}</span>
                <span className="text-xs">Sq.Ft</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Agent: <span className="font-medium text-gray-700">{property.agent || 'Unassigned'}</span>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}