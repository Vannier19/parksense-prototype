import { Car, ParkingCircle, MapPin } from 'lucide-react';
import { Card } from '../components/ui/card';
// @ts-ignore - JavaScript module without a declaration file.
import { useParksense } from '../hooks/useParksense';
import CampusMap from '../components/CampusMap';

export default function Dashboard() {
  // ✅ Ambil slots real dari useParksense
  const { slots, stats, isConnected } = useParksense();

  // Hitung stats dari data real (bukan hardcode)
  const totalSlots = slots.length > 0 ? slots.length : 0;
  const terisiSlots = slots.filter(s => s.status === 1).length;
  const kosongSlots = slots.filter(s => s.status === 0).length;

  const dashboardStats = [
    {
      label: 'Total Capacity',
      value: totalSlots > 0 ? totalSlots.toString() : '—',
      icon: ParkingCircle,
      color: 'bg-blue-500',
    },
    {
      label: 'Current Occupancy',
      value: totalSlots > 0 ? terisiSlots.toString() : '—',
      icon: Car,
      color: 'bg-orange-500',
    },
    {
      label: 'Available Slots',
      value: totalSlots > 0 ? kosongSlots.toString() : '—',
      icon: MapPin,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Not connected to real-time data. Showing last known data.
          </p>
        </div>
      )}

      {isConnected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            ✅ <strong>Real-time connected.</strong> Showing live data from {slots.length} sensor(s).
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-6">
        {dashboardStats.map((stat, index) => {
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
                <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
                  {isConnected ? '● Live data' : '○ Offline'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Interactive Campus Map */}
      <Card className="bg-white shadow-lg border-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">ITB Campus Parking Map</h2>
          <p className="text-sm text-gray-500 mt-1">
            Interactive sensor locations and real-time status
            {slots.length > 0 && ` · ${slots.length} slot(s) active`}
          </p>
        </div>

        <div className="p-6">
          {/* ✅ Kirim slots real ke CampusMap */}
          <CampusMap slots={slots} />
        </div>
      </Card>
    </div>
  );
}