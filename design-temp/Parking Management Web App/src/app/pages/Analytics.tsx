import { Card } from '../components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function Analytics() {
  // Mock data for daily peak hours
  const peakHoursData = [
    { time: '6:00', occupancy: 15 },
    { time: '7:00', occupancy: 35 },
    { time: '8:00', occupancy: 72 },
    { time: '9:00', occupancy: 88 },
    { time: '10:00', occupancy: 92 },
    { time: '11:00', occupancy: 85 },
    { time: '12:00', occupancy: 78 },
    { time: '13:00', occupancy: 82 },
    { time: '14:00', occupancy: 75 },
    { time: '15:00', occupancy: 68 },
    { time: '16:00', occupancy: 85 },
    { time: '17:00', occupancy: 90 },
    { time: '18:00', occupancy: 65 },
    { time: '19:00', occupancy: 42 },
    { time: '20:00', occupancy: 28 },
  ];

  // Mock data for weekly occupancy
  const weeklyOccupancyData = [
    { day: 'Mon', lot1: 85, lot2: 72, lot3: 68 },
    { day: 'Tue', lot1: 88, lot2: 75, lot3: 70 },
    { day: 'Wed', lot1: 92, lot2: 82, lot3: 78 },
    { day: 'Thu', lot1: 90, lot2: 80, lot3: 75 },
    { day: 'Fri', lot1: 95, lot2: 88, lot3: 82 },
    { day: 'Sat', lot1: 45, lot2: 38, lot3: 35 },
    { day: 'Sun', lot1: 32, lot2: 28, lot3: 25 },
  ];

  const summaryStats = [
    { label: 'Average Daily Occupancy', value: '76.5%', trend: '+5.2%' },
    { label: 'Peak Hour', value: '10:00 AM', trend: '92% avg' },
    { label: 'Busiest Day', value: 'Friday', trend: '95% avg' },
    { label: 'Total Vehicles/Day', value: '1,876', trend: '+12.3%' },
  ];

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-full">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analytics & Statistics</h2>
          <p className="text-sm text-gray-500 mt-1">Data insights and trends</p>
        </div>
        <div className="flex gap-3">
          <Select defaultValue="7days">
            <SelectTrigger className="w-[180px] bg-white">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-[180px] bg-white">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="north">North Lot</SelectItem>
              <SelectItem value="south">South Building</SelectItem>
              <SelectItem value="east">East Campus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-6">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="p-6 bg-white shadow-md border-0">
            <p className="text-sm text-gray-500 mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
            <p className="text-xs text-[#3D677A] font-medium">{stat.trend}</p>
          </Card>
        ))}
      </div>

      {/* Daily Peak Hours Chart */}
      <Card className="bg-white shadow-md border-0">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Daily Peak Hours</h3>
          <p className="text-sm text-gray-500 mt-1">Hourly occupancy pattern</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={peakHoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                label={{ value: 'Occupancy (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="occupancy" 
                stroke="#3D677A" 
                strokeWidth={3}
                dot={{ fill: '#3D677A', r: 4 }}
                activeDot={{ r: 6 }}
                name="Occupancy %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Weekly Occupancy Rates */}
      <Card className="bg-white shadow-md border-0">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Weekly Occupancy Rates</h3>
          <p className="text-sm text-gray-500 mt-1">Comparison by parking lot</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={weeklyOccupancyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="day" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                label={{ value: 'Occupancy (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="lot1" fill="#3D677A" name="North Lot A" radius={[8, 8, 0, 0]} />
              <Bar dataKey="lot2" fill="#264851" name="South Building" radius={[8, 8, 0, 0]} />
              <Bar dataKey="lot3" fill="#333C76" name="East Campus" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
