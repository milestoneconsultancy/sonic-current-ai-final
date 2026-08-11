import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  Users,
  Eye,
  Music,
  Search,
  Download,
  Heart,
  TrendingUp,
  Calendar,
  LogOut,
  ShieldAlert,
  Lock,
  BarChart3,
  Globe,
  Radio,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import {
  subscribeToActiveUsers,
  fetchAnalyticsSummary,
  AnalyticsSummary,
} from '../lib/analytics';

const ADMIN_EMAIL = 'khandagalesuraj48@gmail.com';

interface DashboardViewProps {
  onTabChange?: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [emailInput, setEmailInput] = useState(ADMIN_EMAIL);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Realtime Active Users
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
  const [activeUsersList, setActiveUsersList] = useState<any[]>([]);

  // Time Range & Analytics Data
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | '7d' | '14d' | '30d'>('7d');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Realtime Active Users
  useEffect(() => {
    const unsub = subscribeToActiveUsers((count, users) => {
      setActiveUsersCount(count);
      setActiveUsersList(users);
    });
    return () => unsub();
  }, []);

  // Fetch Analytics Summary
  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const data = await fetchAnalyticsSummary(timeRange);
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      loadData();
    }
  }, [currentUser, timeRange]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      setPasswordInput('');
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const isAdmin = currentUser && currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30 shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Admin Portal
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Authorized administrator access only. Enter password for{' '}
              <span className="font-bold text-amber-600 dark:text-amber-400">{ADMIN_EMAIL}</span>.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm tracking-wide transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Admin Intelligence Dashboard</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
                Live
              </span>
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Logged in as <span className="text-slate-900 dark:text-white">{currentUser.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoadingData}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin text-amber-500' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <Calendar className="w-4 h-4 text-amber-500" />
          <span>Analytics Timeframe</span>
        </div>

        <div className="flex items-center bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-1">
          {(['today', 'yesterday', '7d', '14d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                timeRange === r
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Live Active Users */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Live Active Users
            </span>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
            <span>{activeUsersCount}</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">concurrent</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Realtime Firebase presence active
          </p>
        </div>

        {/* Total / Range Visits */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Visits ({timeRange})
            </span>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {analytics?.totalVisits ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Today's Visits: <span className="font-bold text-slate-900 dark:text-white">{analytics?.todayVisits ?? 0}</span>
          </p>
        </div>

        {/* Song Plays */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Song Plays
            </span>
            <Music className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {analytics?.songPlays ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Unique Listeners: <span className="font-bold text-slate-900 dark:text-white">{analytics?.uniqueVisitors ?? 0}</span>
          </p>
        </div>

        {/* Searches */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Searches
            </span>
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {analytics?.searches ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Downloads: <span className="font-bold text-slate-900 dark:text-white">{analytics?.downloads ?? 0}</span> | Likes: <span className="font-bold text-slate-900 dark:text-white">{analytics?.likes ?? 0}</span>
          </p>
        </div>
      </div>

      {/* Traffic Trend Visualizer */}
      {analytics && analytics.dailyData.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>Daily Traffic & Engagement Trend ({timeRange})</span>
          </h2>

          <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2">
            {analytics.dailyData.map((d) => {
              const maxVal = Math.max(...analytics.dailyData.map((item) => Math.max(item.visits, item.plays, 1)));
              const heightPct = Math.max(8, Math.round((d.visits / maxVal) * 100));

              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[9px] font-mono font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.visits}v
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] rounded-xl bg-gradient-to-t from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 transition-all duration-300 shadow-xs"
                  />
                  <span className="text-[9px] font-bold text-slate-400 truncate max-w-[40px] uppercase">
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Searches */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-500" />
            <span>Top Search Queries</span>
          </h2>
          {analytics?.topSearches && analytics.topSearches.length > 0 ? (
            <div className="space-y-2.5">
              {analytics.topSearches.map((s, idx) => (
                <div key={s.query + idx} className="flex items-center justify-between text-xs font-semibold">
                  <span className="truncate pr-2 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-amber-500 mr-2">#{idx + 1}</span> {s.query}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                    {s.count} searches
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No search logs in this timeframe</p>
          )}
        </div>

        {/* Top Artists & Songs */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-500" />
            <span>Top Songs & Artists</span>
          </h2>
          {analytics?.topSongs && analytics.topSongs.length > 0 ? (
            <div className="space-y-2.5">
              {analytics.topSongs.map((s, idx) => (
                <div key={s.title + idx} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate font-bold text-slate-900 dark:text-white">
                      #{idx + 1} {s.title}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">{s.artist}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] shrink-0">
                    {s.count} plays
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No playback logs in this timeframe</p>
          )}
        </div>

        {/* Popular Languages */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-500" />
            <span>Language Preferences</span>
          </h2>
          {analytics?.popularLanguages && analytics.popularLanguages.length > 0 ? (
            <div className="space-y-2.5">
              {analytics.popularLanguages.map((l, idx) => (
                <div key={l.language + idx} className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300 font-bold">{l.language}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                    {l.count} users
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-xs text-slate-500 font-medium">
              <div className="flex justify-between"><span>Hindi</span><span className="font-mono">Active</span></div>
              <div className="flex justify-between"><span>Marathi</span><span className="font-mono">Active</span></div>
              <div className="flex justify-between"><span>Kannada</span><span className="font-mono">Active</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Live Recent Activity Feed */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Realtime Live Event Stream</span>
        </h2>

        {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto pr-1">
            {analytics.recentActivity.map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold uppercase text-[9px] shrink-0">
                    {act.type}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {act.query ? `Query: "${act.query}"` : `${act.title || 'Song'} ${act.artist ? 'by ' + act.artist : ''}`}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No recent activity events recorded yet.</p>
        )}
      </div>
    </div>
  );
};
