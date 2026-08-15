import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Music,
  Search,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  BarChart3,
  Globe,
  Radio,
  Clock,
  RefreshCw,
  Smartphone,
  Laptop,
  Tablet,
  Activity,
  Users,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import {
  subscribeToActiveUsers,
  subscribeToLiveEvents,
  fetchAnalyticsSummary,
  AnalyticsSummary,
} from '../lib/analytics';

interface DashboardViewProps {
  onTabChange?: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Realtime Active Users
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
  const [activeUsersList, setActiveUsersList] = useState<any[]>([]);

  // Time Range & Analytics Data
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | '7d' | '14d' | '30d'>('7d');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 1. Initial Session Verification (Server-Signed Token Check)
  useEffect(() => {
    let isMounted = true;
    const token =
      (typeof window !== 'undefined' &&
        (sessionStorage.getItem('sonic_admin_session_token') ||
          localStorage.getItem('sonic_admin_session_token'))) ||
      '';

    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    fetch('/api/admin/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && data.valid) {
          setIsAdminAuthenticated(true);
        } else {
          sessionStorage.removeItem('sonic_admin_session_token');
          localStorage.removeItem('sonic_admin_session_token');
          setIsAdminAuthenticated(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsAdminAuthenticated(false);
      })
      .finally(() => {
        if (isMounted) setIsCheckingAuth(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Subscribe to Realtime Active Users (Multi-device)
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    const unsub = subscribeToActiveUsers((count, users) => {
      setActiveUsersCount(count);
      setActiveUsersList(users);
    });
    return () => unsub();
  }, [isAdminAuthenticated]);

  // 3. Fetch Analytics Data
  const loadData = async () => {
    if (!isAdminAuthenticated) return;
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

  // 4. Live Realtime Action Stream
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    const unsubLive = subscribeToLiveEvents((liveEvents) => {
      if (liveEvents && liveEvents.length > 0) {
        setAnalytics((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentActivity: liveEvents,
          };
        });
      }
    });
    return () => unsubLive();
  }, [isAdminAuthenticated]);

  // Periodic Auto-Sync
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    loadData();
    const timer = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(timer);
  }, [isAdminAuthenticated, timeRange]);

  // Handle Secure Password Verification via Server API
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setLoginError('Please enter the Admin Security Password.');
      return;
    }

    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        sessionStorage.setItem('sonic_admin_session_token', data.token);
        localStorage.setItem('sonic_admin_session_token', data.token);
        setIsAdminAuthenticated(true);
        setPasswordInput('');
      } else {
        setLoginError(data.error || 'Access Denied: Incorrect Admin Security Password.');
      }
    } catch (err: any) {
      setLoginError('Server authentication request failed. Please check connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sonic_admin_session_token');
    localStorage.removeItem('sonic_admin_session_token');
    localStorage.removeItem('free_music_local_admin');
    setIsAdminAuthenticated(false);
    setPasswordInput('');
    setLoginError(null);
  };

  // Initial Auth Loading State
  if (isCheckingAuth) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-3 border-[#FA2D48]/20 border-t-[#FA2D48] animate-spin" />
        <p className="text-xs text-[#8E8E93] font-medium tracking-wide">
          Verifying Encrypted Admin Session...
        </p>
      </div>
    );
  }

  // Locked Gate Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#38383A] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-[18px] bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center border border-[#FA2D48]/20 shadow-xs">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Admin Security Gateway
            </h2>
            <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal max-w-xs">
              Protected Administrator Area. Only authorized keyholders with encrypted credentials can proceed.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-[14px] bg-[#FA2D48]/10 border border-[#FA2D48]/30 text-black dark:text-white text-xs font-medium space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-2 font-semibold text-[#FA2D48]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Access Denied</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#3C3C43]/80 dark:text-[#EBEBF5]/80">
                {loginError}
              </p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                Admin Secret Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Secret Admin Password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  required
                  className="w-full pl-4 pr-11 py-3 rounded-[14px] bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 text-black dark:text-white text-sm font-medium focus:outline-none focus:border-[#FA2D48] transition placeholder:text-[#8E8E93]/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8E8E93] hover:text-black dark:hover:text-white transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-sm tracking-wide transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoggingIn ? 'Verifying Encrypted Signature...' : 'Unlock Admin Dashboard'}</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-[#8E8E93]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted Server-Side Token Verification</span>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 rounded-[20px] p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-[#FA2D48] text-white flex items-center justify-center font-bold shadow-xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight flex items-center gap-2">
              <span>Admin Intelligence Dashboard</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] text-[10px] font-bold uppercase tracking-wider">
                Live
              </span>
            </h1>
            <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verified Creator & Administrator Session</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={isLoadingData}
            className="p-2.5 rounded-[12px] bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white transition cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin text-[#FA2D48]' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-[#FA2D48]/15 text-black dark:text-white hover:text-[#FA2D48] text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock & Sign Out</span>
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
          <Calendar className="w-4 h-4 text-[#FA2D48]" />
          <span>Analytics Timeframe</span>
        </div>

        <div className="flex items-center bg-[#FFFFFF] dark:bg-[#1C1C1E] p-1 rounded-full border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs gap-1">
          {(['today', 'yesterday', '7d', '14d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                timeRange === r
                  ? 'bg-[#FA2D48] text-white shadow-xs'
                  : 'text-[#8E8E93] hover:text-black dark:hover:text-white'
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
        <div className="p-5 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FA2D48]">
              Live Active Users
            </span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FA2D48] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FA2D48]"></span>
            </span>
          </div>
          <div className="text-3xl font-bold text-black dark:text-white tracking-tight flex items-baseline gap-2">
            <span>{activeUsersCount}</span>
            <span className="text-xs font-medium text-[#FA2D48]">concurrent</span>
          </div>
          <p className="text-[11px] text-[#8E8E93] font-normal">
            Multi-device presence active
          </p>
        </div>

        {/* Total / Range Visits */}
        <div className="p-5 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
              Total Visits ({timeRange})
            </span>
            <Eye className="w-4 h-4 text-[#8E8E93]" />
          </div>
          <div className="text-3xl font-bold text-black dark:text-white tracking-tight">
            {analytics?.totalVisits ?? 0}
          </div>
          <p className="text-[11px] text-[#8E8E93] font-normal">
            Today: <span className="font-semibold text-black dark:text-white">{analytics?.todayVisits ?? 0}</span>
          </p>
        </div>

        {/* Song Plays */}
        <div className="p-5 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
              Song Plays
            </span>
            <Music className="w-4 h-4 text-[#8E8E93]" />
          </div>
          <div className="text-3xl font-bold text-black dark:text-white tracking-tight">
            {analytics?.songPlays ?? 0}
          </div>
          <p className="text-[11px] text-[#8E8E93] font-normal">
            Listeners: <span className="font-semibold text-black dark:text-white">{analytics?.uniqueVisitors ?? 0}</span>
          </p>
        </div>

        {/* Searches */}
        <div className="p-5 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
              Total Searches
            </span>
            <Search className="w-4 h-4 text-[#8E8E93]" />
          </div>
          <div className="text-3xl font-bold text-black dark:text-white tracking-tight">
            {analytics?.searches ?? 0}
          </div>
          <p className="text-[11px] text-[#8E8E93] font-normal">
            Downloads: <span className="font-semibold text-black dark:text-white">{analytics?.downloads ?? 0}</span> | Likes: <span className="font-semibold text-black dark:text-white">{analytics?.likes ?? 0}</span>
          </p>
        </div>
      </div>

      {/* Traffic Trend Visualizer */}
      {analytics && analytics.dailyData.length > 0 && (
        <div className="p-6 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FA2D48]" />
            <span>Daily Traffic & Engagement Trend ({timeRange})</span>
          </h2>

          <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2">
            {analytics.dailyData.map((d) => {
              const maxVal = Math.max(...analytics.dailyData.map((item) => Math.max(item.visits, item.plays, 1)));
              const heightPct = Math.max(8, Math.round((d.visits / maxVal) * 100));

              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[9px] font-mono font-medium text-[#8E8E93] opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.visits}v
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] rounded-[6px] bg-[#FA2D48] hover:bg-[#FC3C44] transition-all duration-300 shadow-2xs"
                  />
                  <span className="text-[9px] font-semibold text-[#8E8E93] truncate max-w-[40px] uppercase">
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Top Searches */}
        <div className="p-6 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-[#FA2D48]" />
            <span>Top Search Queries</span>
          </h2>
          {analytics?.topSearches && analytics.topSearches.length > 0 ? (
            <div className="space-y-2.5">
              {analytics.topSearches.map((s, idx) => (
                <div key={s.query + idx} className="flex items-center justify-between text-xs font-semibold">
                  <span className="truncate pr-2 text-black dark:text-white">
                    <span className="font-bold text-[#FA2D48] mr-2">#{idx + 1}</span> {s.query}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#3C3C43] dark:text-[#EBEBF5] text-[10px]">
                    {s.count} searches
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8E8E93] italic">No search logs in this timeframe</p>
          )}
        </div>

        {/* Top Artists & Songs */}
        <div className="p-6 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-[#FA2D48]" />
            <span>Top Songs & Artists</span>
          </h2>
          {analytics?.topSongs && analytics.topSongs.length > 0 ? (
            <div className="space-y-2.5">
              {analytics.topSongs.map((s, idx) => (
                <div key={s.title + idx} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate font-bold text-black dark:text-white">
                      #{idx + 1} {s.title}
                    </span>
                    <span className="text-[10px] text-[#8E8E93] font-normal truncate">{s.artist}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] text-[10px] font-bold shrink-0">
                    {s.count} plays
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8E8E93] italic">No playback logs in this timeframe</p>
          )}
        </div>

        {/* Popular Languages */}
        <div className="p-6 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#FA2D48]" />
            <span>Language Preferences</span>
          </h2>
          {analytics?.popularLanguages && analytics.popularLanguages.length > 0 ? (
            <div className="space-y-2.5">
              {analytics.popularLanguages.map((l, idx) => (
                <div key={l.language + idx} className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-black dark:text-white font-bold">{l.language}</span>
                  <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#3C3C43] dark:text-[#EBEBF5] text-[10px]">
                    {l.count} users
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-xs text-[#8E8E93] font-normal">
              <div className="flex justify-between"><span>Hindi</span><span className="font-semibold text-black dark:text-white">Active</span></div>
              <div className="flex justify-between"><span>Marathi</span><span className="font-semibold text-black dark:text-white">Active</span></div>
              <div className="flex justify-between"><span>Kannada</span><span className="font-semibold text-black dark:text-white">Active</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Live Connected Sessions & Realtime Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Connected Live Users Card */}
        <div className="p-6 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FA2D48]" />
              <span>Live Connected Sessions ({activeUsersList.length})</span>
            </h2>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#FA2D48]">
              <span className="w-2 h-2 rounded-full bg-[#FA2D48] animate-ping" />
              Live Presence
            </span>
          </div>

          <div className="divide-y divide-[#C6C6C8]/30 dark:divide-[#38383A]/50 max-h-64 overflow-y-auto pr-1">
            {activeUsersList.map((user, idx) => (
              <div key={user.sessionId || idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white shrink-0">
                    {user.device === 'Mobile' ? (
                      <Smartphone className="w-4 h-4 text-[#FA2D48]" />
                    ) : user.device === 'Tablet' ? (
                      <Tablet className="w-4 h-4 text-[#FA2D48]" />
                    ) : (
                      <Laptop className="w-4 h-4 text-[#FA2D48]" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-black dark:text-white truncate">
                        {user.email && user.email !== 'anonymous' && user.email !== 'Guest Visitor'
                          ? user.email
                          : `Device #${(user.sessionId || '88').slice(-5)}`}
                      </span>
                      <span className="px-1.5 py-0.2 bg-[#FA2D48]/10 text-[#FA2D48] text-[9px] font-bold rounded">
                        {user.device}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8E8E93] truncate">
                      {user.deviceDetail || `${user.os || ''} ${user.browser || ''}`.trim() || 'Device'} • Tab: <span className="capitalize">{user.page || 'Home'}</span>
                      {user.activeSong ? ` • 🎵 ${user.activeSong}` : ''}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Recent Activity Feed */}
        <div className="p-6 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FA2D48] animate-pulse" />
              <span>Realtime Live Action Stream</span>
            </h2>
            <span className="text-[10px] text-[#8E8E93]">Auto-updated</span>
          </div>

          {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
            <div className="divide-y divide-[#C6C6C8]/30 dark:divide-[#38383A]/50 max-h-64 overflow-y-auto pr-1">
              {analytics.recentActivity.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] font-bold uppercase text-[9px] shrink-0">
                      {act.type}
                    </span>
                    <span className="font-medium text-black dark:text-white truncate">
                      {act.query ? `Query: "${act.query}"` : `${act.title || 'Song'} ${act.artist ? 'by ' + act.artist : ''}`}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8E8E93] shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8E8E93] italic">No recent activity events recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
