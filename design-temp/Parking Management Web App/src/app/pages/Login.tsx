import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - just navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1741955693780-24dd32619f6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJrZWQlMjBjYXJzJTIwcGFya2luZyUyMGxvdCUyMHVyYmFufGVufDF8fHx8MTc3NTgyOTU0OXww&ixlib=rb-4.1.0&q=80&w=1080)',
          filter: 'blur(4px)',
        }}
      />
      <div className="absolute inset-0 bg-[#235563] opacity-70" />

      {/* Logo */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center relative">
            <div className="w-8 h-8 border-4 border-[#235563] rounded-full relative">
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#235563] rounded-full" />
            </div>
          </div>
          <span className="text-white text-2xl font-semibold tracking-wide">PARKSENSE</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Login to your account</h1>
        <p className="text-gray-500 mb-8">Welcome back! Please enter your details.</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-gray-300 focus:border-[#3D677A] focus:ring-[#3D677A]"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <a href="#" className="text-sm text-[#3D677A] hover:underline">Forgot?</a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-gray-300 focus:border-[#3D677A] focus:ring-[#3D677A]"
              required
            />
          </div>

          <Button 
            type="submit"
            className="w-full bg-[#264851] hover:bg-[#1e3840] text-white py-6 text-base"
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
