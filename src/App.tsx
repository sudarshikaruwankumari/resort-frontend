// src/App.tsx
import { useState, useEffect } from 'react';
import Auth from './pages/Auth'; // your Auth page with login/register tabs
import Home from './pages/Home';
import Reservations from './pages/Reservations';
 

// Simple page components (you can expand them later)
 
 

// ────────────────────────────────────────────────────────────────

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);
  const [activePage, setActivePage] = useState<'home' | 'customers' | 'reservations'>('home');

  // Check if already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Login success callback (called from Auth page)
  const handleLogin = (token: string, username: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ username }));
    setIsAuthenticated(true);
    setCurrentUser({ username });
    setActivePage('home');
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActivePage('home');
  };

  // ── Not logged in → show Auth ─────────────────────────────────
  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLogin} />;
  }

  // ── Logged in → show full app layout ──────────────────────────
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-teal-800 text-white flex flex-col">
        {/* Logo / Title */}
        <div className="p-6 border-b border-teal-700">
          <h2 className="text-2xl font-bold">Ocean View Resort</h2>
          <p className="text-teal-200 text-sm mt-1">Management Panel</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActivePage('home')}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activePage === 'home' ? 'bg-teal-600' : 'hover:bg-teal-700'
                }`}
              >
                Home
              </button>
            </li>
            
            <li>
              <button
                onClick={() => setActivePage('reservations')}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activePage === 'reservations' ? 'bg-teal-600' : 'hover:bg-teal-700'
                }`}
              >
                Reservations
              </button>
            </li>
          </ul>
        </nav>

        {/* Footer with logout */}
        <div className="p-4 border-t border-teal-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{currentUser?.username}</p>
              <p className="text-xs text-teal-300">Logged in</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded hover:bg-teal-700 transition"
              title="Logout"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800 capitalize">
            {activePage}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, <strong>{currentUser?.username}</strong>
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activePage === 'home' && <Home />}
          
          {activePage === 'reservations' && <Reservations />}
        </main>
      </div>
    </div>
  );
}

export default App;