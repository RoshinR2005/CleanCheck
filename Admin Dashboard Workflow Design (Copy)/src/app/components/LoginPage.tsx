import { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useT } from '../ThemeContext';

type AppUser = { role: 'admin' | 'cleaner'; name: string; id: string };

interface Props {
  onLogin: (user: AppUser) => void;
}

const ALL_USERS: Array<AppUser & { username: string; password: string }> = [
  { username: 'admin',  password: 'admin123',  role: 'admin',   name: 'Admin User',   id: 'admin-1'   },
  { username: 'maria',  password: 'clean123',  role: 'cleaner', name: 'Maria Santos', id: 'cleaner-1' },
  { username: 'james',  password: 'clean123',  role: 'cleaner', name: 'James Okafor', id: 'cleaner-2' },
];

export function LoginPage({ onLogin }: Props) {
  const t = useT();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const match = ALL_USERS.find(u => u.username === username.trim() && u.password === password);
      if (match) {
        onLogin({ role: match.role, name: match.name, id: match.id });
      } else {
        setError('Invalid username or password.');
      }
    }, 800);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${t.page}`}>
      <div className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col ${t.isDark ? 'border border-gray-700' : ''}`}>

        {/* Header */}
        <div className="bg-orange-500 px-6 pt-12 pb-10 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="text-xl font-semibold">CleanCheck</div>
              <div className="text-xs text-orange-100">NFC Compliance</div>
            </div>
          </div>
          <p className="text-orange-100 text-sm mt-3">Sign in with your employee credentials</p>
        </div>

        {/* Form */}
        <div className={`flex-1 px-6 py-8 ${t.cardFlat}`}>
          <h2 className={`text-xl font-semibold mb-6 ${t.text}`}>Welcome back</h2>

          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${t.textSm}`}>Username</label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted}`} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${t.input}`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${t.textSm}`}>Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted}`} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className={`w-full pl-10 pr-11 py-3 border rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${t.input}`}
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted}`}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-orange-600 transition-colors mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>

          {/* Demo hint */}
          <div className={`mt-6 p-4 rounded-xl border ${t.isDark ? 'bg-gray-800 border-gray-700' : 'bg-orange-50 border-orange-100'}`}>
            <p className={`text-xs font-medium mb-1 ${t.textXs}`}>Demo credentials</p>
            <p className={`text-xs ${t.textMuted}`}>Admin: admin / admin123</p>
            <p className={`text-xs ${t.textMuted}`}>Cleaner: maria / clean123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
