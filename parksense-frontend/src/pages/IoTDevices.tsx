import { Cpu, Wifi, WifiOff, RotateCw } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useIoTDevices } from '../hooks/useIoTDevices';

export default function IoTDevices() {
  const { devices, realSensorData, isConnected, isLoading, error, refreshDevices } = useIoTDevices();

  // Calculate stats
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;
  const totalCount = devices.length;

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBg = (status: string) => {
    return status === 'online' ? 'bg-green-50' : 'bg-red-50';
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#235563] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading IoT Devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Connection Status Banners */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Backend not available. Using dummy data for non-real sensors.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            ❌ Connection error: {error}
          </p>
        </div>
      )}

      {realSensorData && isConnected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            ✅ <strong>Sensor Labtek 5 - A/B connected!</strong> Real-time: {realSensorData.occupied} occupied, {realSensorData.available} available ({realSensorData.occupancy}%)
          </p>
        </div>
      )}

      {/* Header with Stats */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="p-6 bg-white shadow-lg border-0">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Wifi className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Online Devices</p>
              <p className="text-2xl font-bold text-gray-800">{onlineCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-white shadow-lg border-0">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <WifiOff className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Offline Devices</p>
              <p className="text-2xl font-bold text-gray-800">{offlineCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-white shadow-lg border-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Cpu className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Devices</p>
              <p className="text-2xl font-bold text-gray-800">{totalCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Devices Table */}
      <Card className="bg-white shadow-lg border-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">IoT Devices</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Device Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${getStatusBg(device.status)}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-gray-800">{device.name}</p>
                        <p className="text-xs text-gray-500">v{device.version}</p>
                      </div>
                      {device.isReal && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          REAL
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{device.location}</td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2`}>
                      <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className={`capitalize font-medium ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{device.lastUpdate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Device Details Modal */}
      <Card className="bg-white shadow-lg border-0 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Real-Time Sensor Data (Labtek 5 - A/B)</h3>
        {realSensorData && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 font-semibold mb-1">OCCUPIED</p>
              <p className="text-2xl font-bold text-blue-700">{realSensorData.occupied}</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-600 font-semibold mb-1">AVAILABLE</p>
              <p className="text-2xl font-bold text-green-700">{realSensorData.available}</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs text-purple-600 font-semibold mb-1">OCCUPANCY</p>
              <p className="text-2xl font-bold text-purple-700">{realSensorData.occupancy}%</p>
            </div>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-orange-600 font-semibold mb-1">BATTERY</p>
              <p className="text-2xl font-bold text-orange-700">{Math.round(realSensorData.battery)}%</p>
            </div>
          </div>
        )}

        <h3 className="text-lg font-bold text-gray-800 mb-4">Device Maintenance Alerts</h3>
        <div className="grid grid-cols-2 gap-4">
          {devices.filter(d => d.battery < 50 && d.battery > 0).length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ Low Battery Alerts</p>
              {devices.filter(d => d.battery < 50 && d.battery > 0).map(d => (
                <p key={d.id} className="text-sm text-yellow-700">{d.name}: {d.battery}%</p>
              ))}
            </div>
          )}
          
          {devices.filter(d => d.status === 'offline').length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-2">🔴 Offline Devices</p>
              {devices.filter(d => d.status === 'offline').map(d => (
                <p key={d.id} className="text-sm text-red-700">{d.name} - {d.lastUpdate}</p>
              ))}
            </div>
          )}

          {devices.filter(d => d.battery < 50 && d.battery > 0).length === 0 && 
           devices.filter(d => d.status === 'offline').length === 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg col-span-2">
              <p className="text-sm font-medium text-green-800">✅ All Devices Operating Normally</p>
              <p className="text-sm text-green-700">No alerts to display</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
