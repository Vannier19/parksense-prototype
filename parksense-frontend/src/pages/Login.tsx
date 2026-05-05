import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
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
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-700">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border-gray-300 focus:border-[#3D677A] focus:ring-[#3D677A]"
              required
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit"
            className="w-full bg-[#264851] hover:bg-[#1e3840] text-white py-6 text-base"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">Demo Credentials:</p>
            <p className="text-xs text-gray-600 text-center">Username: <span className="font-mono">admin</span></p>
            <p className="text-xs text-gray-600 text-center">Password: <span className="font-mono">12345678</span></p>
          </div>
        </form>
      </div>
    </div>
  );
}
