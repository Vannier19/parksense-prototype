import { Car, ParkingCircle, MapPin } from 'lucide-react';
import { Card } from '../components/ui/card';

export default function Dashboard() {
  // Mock data for parking areas
  const parkingAreas = [
    { id: 1, name: 'North Lot A', x: 35, y: 25, occupancy: 85, color: 'red' },
    { id: 2, name: 'North Lot B', x: 55, y: 28, occupancy: 72, color: 'yellow' },
    { id: 3, name: 'South Building', x: 40, y: 55, occupancy: 45, color: 'yellow' },
    { id: 4, name: 'East Campus', x: 70, y: 45, occupancy: 28, color: 'green' },
    { id: 5, name: 'West Stadium', x: 20, y: 60, occupancy: 92, color: 'red' },
    { id: 6, name: 'Central Plaza', x: 48, y: 42, occupancy: 15, color: 'green' },
  ];

  const getHeatmapColor = (occupancy: number) => {
    if (occupancy >= 80) return 'rgba(239, 68, 68, 0.6)'; // Red
    if (occupancy >= 50) return 'rgba(234, 179, 8, 0.6)'; // Yellow
    return 'rgba(34, 197, 94, 0.6)'; // Green
  };

  const stats = [
    {
      label: 'Total Capacity',
      value: '2,450',
      icon: ParkingCircle,
      color: 'bg-blue-500',
    },
    {
      label: 'Current Occupancy',
      value: '1,876',
      icon: Car,
      color: 'bg-orange-500',
    },
    {
      label: 'Available Slots',
      value: '574',
      icon: MapPin,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 bg-white shadow-lg border-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-[#3D677A] font-medium">Real-time data</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Map with Heatmap */}
      <Card className="bg-white shadow-lg border-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Campus Parking Heatmap</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time occupancy visualization</p>
        </div>
        
        <div className="relative w-full h-[600px] bg-gradient-to-br from-gray-100 to-gray-200">
          {/* Background Map Image */}
          <img 
            src="https://images.unsplash.com/photo-1655543274920-06de452d0d02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwdmlld3xlbnwxfHx8fDE3NzU3NTgxMjB8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Campus Map"
            className="w-full h-full object-cover opacity-40"
          />

          {/* Heatmap Overlays */}
          {parkingAreas.map((area) => (
            <div
              key={area.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{
                left: `${area.x}%`,
                top: `${area.y}%`,
              }}
            >
              {/* Heatmap Circle */}
              <div
                className="w-24 h-24 rounded-full blur-xl transition-all group-hover:scale-110"
                style={{
                  backgroundColor: getHeatmapColor(area.occupancy),
                }}
              />
              
              {/* Info Tooltip */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="bg-white rounded-lg shadow-xl p-4 min-w-[200px] border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-2">{area.name}</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      Occupancy: <span className="font-semibold">{area.occupancy}%</span>
                    </p>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          area.occupancy >= 80 ? 'bg-red-500' : 
                          area.occupancy >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${area.occupancy}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-3 text-sm">Occupancy Level</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-green-500" />
                <span className="text-sm text-gray-600">Low (0-50%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-yellow-500" />
                <span className="text-sm text-gray-600">Medium (50-80%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-red-500" />
                <span className="text-sm text-gray-600">High (80-100%)</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
