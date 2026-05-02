import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import UserView       from './pages/UserView';

function App() {
  return (
    <BrowserRouter>
      {/* Navbar navigasi sederhana */}
      <nav style={navStyle}>
        <Link to="/"       style={linkStyle}>🅿️ User View</Link>
        <Link to="/admin"  style={linkStyle}>⚙️ Admin Dashboard</Link>
      </nav>

      {/* Routing halaman */}
      <Routes>
        <Route path="/"      element={<UserView />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

const navStyle = {
  background: '#1e293b',
  padding: '12px 24px',
  display: 'flex',
  gap: '24px',
  borderBottom: '1px solid #334155',
};

const linkStyle = {
  color: '#94a3b8',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '500',
};

export default App;