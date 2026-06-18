import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { AdminApp } from './components/admin/AdminApp';
import { CleanerApp } from './components/cleaner/CleanerApp';
import { ThemeProvider, useTheme } from './ThemeContext';

type AppUser = { role: 'admin' | 'cleaner'; name: string; id: string };

export default function App() {
  return (
    <ThemeProvider>
      <AppRoot />
    </ThemeProvider>
  );
}

function AppRoot() {
  const { isDark } = useTheme();
  const [user, setUser] = useState<AppUser | null>(null);

  return (
    <div className={isDark ? 'dark' : ''}>
      {!user && <LoginPage onLogin={setUser} />}
      {user?.role === 'admin' && <AdminApp user={user} onLogout={() => setUser(null)} />}
      {user?.role === 'cleaner' && <CleanerApp user={user} onLogout={() => setUser(null)} />}
    </div>
  );
}
