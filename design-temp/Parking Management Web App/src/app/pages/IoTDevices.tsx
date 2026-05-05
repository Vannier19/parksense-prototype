import { Card } from '../components/ui/card';
import { Cpu, Wifi, WifiOff, AlertCircle, CheckCircle, Server, Camera, Gauge } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export default function IoTDevices() {
  const deviceCategories = [
    {
      name: 'Edge Controllers',
      devices: [
        { id: 'EC-001', name: 'North Lot Controller', location: 'North Parking - Building A', status: 'online', uptime: '99.8%' },
        { id: 'EC-002', name: 'South Lot Controller', location: 'South Parking - Building B', status: 'online', uptime: '99.5%' },
        { id: 'EC-003', name: 'East Campus Controller', location: 'East Campus - Main Gate', status: 'maintenance', uptime: '85.2%' },
        { id: 'EC-004', name: 'West Stadium Controller', location: 'West Parking - Stadium', status: 'online', uptime: '98.9%' },
      ],
    },
    {
      name: 'Gate Sensors',
      devices: [
        { id: 'GS-101', name: 'North Gate In', location: 'North Lot - Entry Point A', status: 'online', uptime: '100%' },
        { id: 'GS-102', name: 'North Gate Out', location: 'North Lot - Exit Point A', status: 'online', uptime: '99.9%' },
        { id: 'GS-103', name: 'South Gate In', location: 'South Building - Entry', status: 'offline', uptime: '0%' },
        { id: 'GS-104', name: 'East Gate Sensor', location: 'East Campus - Main Entry', status: 'online', uptime: '99.2%' },
      ],
    },
    {
      name: 'Occupancy Sensors',
      devices: [
        { id: 'OS-201', name: 'Zone A Sensors', location: 'North Lot - Zone A (50 spots)', status: 'online', uptime: '99.6%' },
        { id: 'OS-202', name: 'Zone B Sensors', location: 'North Lot - Zone B (75 spots)', status: 'online', uptime: '99.1%' },
        { id: 'OS-203', name: 'Zone C Sensors', location: 'South Building (120 spots)', status: 'online', uptime: '98.8%' },
        { id: 'OS-204', name: 'Zone D Sensors', location: 'East Campus (90 spots)', status: 'maintenance', uptime: '92.3%' },
      ],
    },
  ];

  const recentAlerts = [
    { id: 1, device: 'GS-103', message: 'South Gate In - Connection Lost', timestamp: '2 minutes ago', severity: 'critical' },
    { id: 2, device: 'EC-003', message: 'East Campus Controller - Scheduled Maintenance', timestamp: '1 hour ago', severity: 'warning' },
    { id: 3, device: 'OS-204', message: 'Zone D Sensors - Firmware Update Required', timestamp: '3 hours ago', severity: 'warning' },
    { id: 4, device: 'OS-202', message: 'Zone B Sensors - Calibration Complete', timestamp: '5 hours ago', severity: 'info' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-4 h-4" />;
      case 'offline':
        return <WifiOff className="w-4 h-4" />;
      case 'maintenance':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Cpu className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (name: string) => {
    if (name.includes('Controller')) return Server;
    if (name.includes('Gate')) return Camera;
    if (name.includes('Occupancy')) return Gauge;
    return Cpu;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate summary statistics
  const totalDevices = deviceCategories.reduce((sum, cat) => sum + cat.devices.length, 0);
  const onlineDevices = deviceCategories.reduce(
    (sum, cat) => sum + cat.devices.filter(d => d.status === 'online').length, 
    0
  );
  const offlineDevices = deviceCategories.reduce(
    (sum, cat) => sum + cat.devices.filter(d => d.status === 'offline').length, 
    0
  );
  const maintenanceDevices = deviceCategories.reduce(
    (sum, cat) => sum + cat.devices.filter(d => d.status === 'maintenance').length, 
    0
  );

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">IoT Device Monitoring</h2>
        <p className="text-sm text-gray-500 mt-1">Hardware status and health monitoring</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="p-6 bg-white shadow-md border-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Devices</p>
            <Cpu className="w-5 h-5 text-[#3D677A]" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalDevices}</p>
        </Card>

        <Card className="p-6 bg-white shadow-md border-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Online</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{onlineDevices}</p>
        </Card>

        <Card className="p-6 bg-white shadow-md border-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Maintenance</p>
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">{maintenanceDevices}</p>
        </Card>

        <Card className="p-6 bg-white shadow-md border-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Offline</p>
            <WifiOff className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{offlineDevices}</p>
        </Card>
      </div>

      {/* Device Categories */}
      {deviceCategories.map((category, catIndex) => {
        const CategoryIcon = getCategoryIcon(category.name);
        return (
          <Card key={catIndex} className="bg-white shadow-md border-0">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3D677A] rounded-lg flex items-center justify-center">
                  <CategoryIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.devices.length} devices</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 p-6">
              {category.devices.map((device) => (
                <div
                  key={device.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-[#3D677A] hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-800">{device.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {device.id}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{device.location}</p>
                    </div>
                    <div className={`w-8 h-8 ${getStatusColor(device.status)} rounded-full flex items-center justify-center text-white`}>
                      {getStatusIcon(device.status)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Uptime</span>
                    <span className="text-sm font-semibold text-gray-800">{device.uptime}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {/* Recent Alerts */}
      <Card className="bg-white shadow-md border-0">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Recent Alerts</h3>
          <p className="text-sm text-gray-500 mt-1">Latest system notifications and events</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Device ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Severity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-gray-800">{alert.device}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{alert.message}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{alert.timestamp}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${getSeverityColor(alert.severity)} border`}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
