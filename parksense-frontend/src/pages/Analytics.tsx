import { BarChart3, Clock, Car } from 'lucide-react';
import { Card } from '../components/ui/card';
import { useParksense } from '../hooks/useParksense';
import { useIoTDevices } from '../hooks/useIoTDevices';

export default function Analytics() {
  const { activityLog } = useParksense();
  const { realSensorData } = useIoTDevices();

  const analyticsCards = [
    {
      label: 'Peak Hour',
      value: '2:30 PM',
      icon: Clock,
      color: 'bg-purple-500',
      change: '+5% from yesterday'
    },
    {
      label: 'Avg Occupancy',
      value: '76.5%',
      icon: BarChart3,
      color: 'bg-blue-500',
      change: '+2% from last week'
    },
    {
      label: 'Total Vehicles',
      value: '1,876',
      icon: Car,
      color: 'bg-orange-500',
      change: '+12 from yesterday'
    },
  ];

  const hourlyOccupancy = [
    { hour: '6 AM', occupancy: 15 },
    { hour: '8 AM', occupancy: 45 },
    { hour: '10 AM', occupancy: 72 },
    { hour: '12 PM', occupancy: 88 },
    { hour: '2 PM', occupancy: 92 },
    { hour: '4 PM', occupancy: 85 },
    { hour: '6 PM', occupancy: 60 },
    { hour: '8 PM', occupancy: 30 },
  ];

  // ✅ Use real data from Labtek 5-A sensor for that zone, others remain dummy
  const zoneStats = [
    { 
      zone: 'Labtek 5 Parking', 
      total: realSensorData?.total || 250, 
      occupied: realSensorData?.occupied || 212, 
      available: realSensorData?.available || 38 
    },
    { zone: 'Labtek 8 Parking', total: 200, occupied: 144, available: 56 },
    { zone: 'GKUT Parking', total: 180, occupied: 81, available: 99 },
    { zone: 'Gate Parking', total: 320, occupied: 90, available: 230 },
    { zone: 'Sports Field', total: 280, occupied: 258, available: 22 },
    { zone: 'Student Lot', total: 240, occupied: 36, available: 204 },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-4 gap-4">
        {analyticsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="p-6 bg-white shadow-lg border-0">
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800 mb-2">{card.value}</p>
              <p className="text-xs text-green-600">{card.change}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Hourly Occupancy Chart */}
        <Card className="p-6 bg-white shadow-lg border-0">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Hourly Occupancy</h3>
          <div className="flex items-end gap-2 h-48">
            {hourlyOccupancy.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-200 rounded-t relative group cursor-pointer" 
                     style={{ height: `${(item.occupancy / 100) * 180}px` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {item.occupancy}%
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">{item.hour}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Zone Statistics */}
        <Card className="p-6 bg-white shadow-lg border-0">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Zone Statistics</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {zoneStats.map((zone, index) => (
              <div key={index} className="border-b pb-3 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm text-gray-800">{zone.zone}</span>
                  <span className="text-xs text-gray-600">{zone.occupied}/{zone.total}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${(zone.occupied / zone.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{zone.occupied} occupied</span>
                  <span>{zone.available} available</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Log */}
      <Card className="p-6 bg-white shadow-lg border-0">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {(activityLog || []).slice(0, 10).map((activity, index) => (
            <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
              <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                activity.action === 'occupied' ? 'bg-red-500' : 'bg-green-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm text-gray-800">
                  <span className="font-medium">Slot {activity.slot_id}</span>
                  {' '}{activity.action === 'occupied' ? 'became occupied' : 'became available'}
                </p>
                <p className="text-xs text-gray-500">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
