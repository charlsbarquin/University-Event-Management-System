import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { eventsService } from '../../services/events';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, MapPin, Users, FileText, Bell, Plus, Clock, CheckCircle, X, Eye, Trash2, Send, ChevronRight, Sparkles, Zap, BarChart3, Image, Users as UsersIcon, Shield, TrendingUp, Activity, Settings } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDashboardData();
    }
  }, [user, retryCount]);

  const loadDashboardData = async () => {
    try {
      setError(null);
      console.log('🔄 Loading admin dashboard data...');
      
      const [statsResult, pendingResult, allEventsResult] = await Promise.all([
        adminService.getStatistics().catch(err => {
          console.error('Statistics error:', err);
          return { success: false, message: 'Failed to load statistics' };
        }),
        adminService.getPendingEvents().catch(err => {
          console.error('Pending events error:', err);
          return { success: false, message: 'Failed to load pending events' };
        }),
        eventsService.getEvents({ limit: 100 }).catch(err => {
          console.error('All events error:', err);
          return { success: false, message: 'Failed to load all events' };
        })
      ]);

      console.log('📊 API Results:', {
        stats: statsResult.success,
        pending: pendingResult.success,
        events: allEventsResult.success
      });

      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        console.error('Stats failed:', statsResult.message);
        toast.error('Failed to load statistics');
      }

      if (pendingResult.success) {
        setPendingEvents(pendingResult.data.events || []);
      } else {
        console.error('Pending events failed:', pendingResult.message);
        toast.error('Failed to load pending events');
        setPendingEvents([]);
      }

      if (allEventsResult.success) {
        setAllEvents(allEventsResult.data.events || []);
      } else {
        console.error('All events failed:', allEventsResult.message);
        toast.error('Failed to load all events');
        setAllEvents([]);
      }
    } catch (error) {
      console.error('❌ Dashboard load error:', error);
      setError('Failed to load dashboard data. Please check your connection.');
      toast.error('Network error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadComprehensiveAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const result = await adminService.getComprehensiveAnalytics();
      
      if (result.success) {
        setAnalytics(result.data);
        toast.success('Analytics loaded successfully');
      } else {
        toast.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Analytics load error:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    toast.info('Retrying to load dashboard data...');
  };

  const handleApprove = async (eventId) => {
    try {
      const result = await adminService.approveEvent(eventId);
      if (result.success) {
        toast.success('Event approved! Creator promoted to Organizer.');
        // Remove from local state immediately
        setPendingEvents(prev => prev.filter(event => event._id !== eventId));
        // Also remove from all events if it's there
        setAllEvents(prev => prev.filter(event => event._id !== eventId));
        
        // Update stats locally
        if (stats) {
          setStats(prev => {
            const updatedEventStats = prev.eventStats.map(stat => {
              if (stat._id === 'pending') {
                return { ...stat, count: Math.max(0, stat.count - 1) };
              }
              if (stat._id === 'approved') {
                return { ...stat, count: stat.count + 1 };
              }
              return stat;
            });
            
            return {
              ...prev,
              eventStats: updatedEventStats
            };
          });
        }
      }
    } catch (error) {
      console.error('Approval error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      if (errorMessage.includes('not pending approval')) {
        toast.info('Event was already approved or removed');
        setPendingEvents(prev => prev.filter(event => event._id !== eventId));
        setAllEvents(prev => prev.filter(event => event._id !== eventId));
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.');
      } else {
        toast.error('Failed to approve event: ' + errorMessage);
      }
    }
  };

  const handleReject = async (eventId, rejectionNotes) => {
    if (!rejectionNotes || rejectionNotes.trim() === '') {
      toast.error('Please provide rejection notes');
      return;
    }

    try {
      const result = await adminService.rejectEvent(eventId, rejectionNotes);
      if (result.success) {
        toast.success('Event rejected');
        setPendingEvents(prev => prev.filter(event => event._id !== eventId));
        setAllEvents(prev => prev.filter(event => event._id !== eventId));
        
        if (stats) {
          setStats(prev => ({
            ...prev,
            eventStats: prev.eventStats.map(stat => 
              stat._id === 'pending' 
                ? { ...stat, count: Math.max(0, stat.count - 1) }
                : stat._id === 'rejected'
                ? { ...stat, count: stat.count + 1 }
                : stat
            )
          }));
        }
      }
    } catch (error) {
      console.error('Rejection error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      if (errorMessage.includes('not pending approval')) {
        toast.info('Event was already rejected or removed');
        setPendingEvents(prev => prev.filter(event => event._id !== eventId));
        setAllEvents(prev => prev.filter(event => event._id !== eventId));
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.');
      } else {
        toast.error('Failed to reject event: ' + errorMessage);
      }
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle, status) => {
    let confirmMessage = `Are you sure you want to delete "${eventTitle}"? `;
    confirmMessage += `Status: ${status}. `;
    confirmMessage += `As Admin, you can delete ANY event. This cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await eventsService.deleteEvent(eventId);
      if (result.success) {
        toast.success(`Event "${eventTitle}" deleted successfully`);
        
        // Remove from both pending and all events
        setPendingEvents(prev => prev.filter(event => event._id !== eventId));
        setAllEvents(prev => prev.filter(event => event._id !== eventId));
        
        if (stats) {
          setStats(prev => ({
            ...prev,
            eventStats: prev.eventStats.map(stat => 
              stat._id === status 
                ? { ...stat, count: Math.max(0, stat.count - 1) }
                : stat
            )
          }));
        }
      } else {
        toast.error(result.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Admin delete error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.');
      } else {
        toast.error('Failed to delete event: ' + errorMessage);
      }
    }
  };

  const renderAnalyticsTab = () => {
    if (!analytics) {
      return (
        <div className="text-center py-12">
          <button
            onClick={loadComprehensiveAnalytics}
            disabled={analyticsLoading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {analyticsLoading ? 'Loading...' : 'Load Comprehensive Analytics'}
          </button>
          <p className="text-gray-500 mt-4">Click to load detailed analytics data</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* System Health Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">System Health Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{analytics.summary.systemHealthScore}</div>
              <div className="text-sm text-gray-600 mt-1">Health Score</div>
              <div className="text-xs mt-2 capitalize">{analytics.insights.healthLevel}</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{analytics.summary.approvalRate}%</div>
              <div className="text-sm text-gray-600 mt-1">Approval Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{analytics.summary.userActivityRate}%</div>
              <div className="text-sm text-gray-600 mt-1">User Activity</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{analytics.summary.weeklyGrowth}</div>
              <div className="text-sm text-gray-600 mt-1">Weekly Growth</div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">🏆 Top Performing Events</h3>
            <div className="space-y-3">
              {analytics.performance.topEvents.map((event, index) => (
                <div key={event._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{index + 1}.</span>
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-[9px] text-gray-500">
                          {new Date(event.date).toLocaleDateString()} • {event.category}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{event.fillRate}%</div>
                    <div className="text-xs text-gray-500">{event.currentAttendees}/{event.maxAttendees}</div>
                  </div>
                </div>
              ))}
              {analytics.performance.topEvents.length === 0 && (
                <p className="text-gray-500 text-center py-4">No top performing events yet</p>
              )}
            </div>
          </div>

          {/* Registration Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📈 Registration Trends</h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{analytics.trends.dailyAverage}</div>
                <div className="text-sm text-gray-600">Daily Average Registrations</div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Peak Day</span>
                  <span className="text-sm text-gray-600">{analytics.trends.peakDay.date}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min((analytics.trends.peakDay.count / Math.max(analytics.trends.dailyAverage * 2, 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">
                  {analytics.trends.peakDay.count} registrations
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total Registrations:</span> {analytics.trends.totalRegistrations}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Trend:</span> {analytics.insights.growthTrend}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Event Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.performance.highPerformanceEvents}</div>
              <div className="text-sm text-gray-600">High Performance Events (80%+ fill rate)</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{analytics.performance.moderatePerformanceEvents}</div>
              <div className="text-sm text-gray-600">Moderate Performance (50-79% fill rate)</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.performance.averageFillRate}%</div>
              <div className="text-sm text-gray-600">Average Fill Rate</div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {analytics.insights.recommendations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-800 mb-3">💡 Recommendations</h3>
            <ul className="space-y-2">
              {analytics.insights.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span className="text-yellow-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{analytics.summary.totalEvents}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{analytics.summary.totalUsers}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{analytics.summary.approvedEvents}</div>
              <div className="text-sm text-gray-600">Approved Events</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{analytics.summary.recentRegistrations}</div>
              <div className="text-sm text-gray-600">Recent Registrations</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-[#0A2FF1] rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Admin privileges required to access this page.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0A2FF1] via-[#1a4af8] to-[#0818A8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-500 font-semibold hover:scale-105 active:scale-95"
          >
            Go to User Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0A2FF1] via-[#1a4af8] to-[#0818A8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-500 font-semibold hover:scale-105 active:scale-95"
            >
              Retry Loading
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 font-semibold hover:scale-105 active:scale-95"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalEvents = stats?.eventStats?.reduce((acc, curr) => acc + curr.count, 0) || 0;
  const pendingCount = stats?.eventStats?.find(e => e._id === 'pending')?.count || 0;
  const totalUsers = stats?.userStats?.reduce((acc, curr) => acc + curr.count, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-3000"></div>
      </div>

      <div className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-[#0A2FF1]" />
              <span className="text-sm font-semibold text-[#0A2FF1] bg-blue-100 px-3 py-1 rounded-full">
                Admin Dashboard
              </span>
              <Sparkles className="w-6 h-6 text-[#0A2FF1]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight leading-tight">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Manage the university event system and oversee all activities
            </p>
          </div>

          {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => {
                  setActiveTab('analytics');
                  if (!analytics) {
                    loadComprehensiveAnalytics();
                  }
                }}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Events ({pendingEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('all-events')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'all-events'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Events ({allEvents.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                {/* Enhanced Statistics Cards */}
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">System Overview</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Live
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-primary-600">{totalEvents}</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Approved Events</span>
                          <span className="font-medium text-green-600">
                            {stats.eventStats?.find(e => e._id === 'approved')?.count || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Pending Approval</span>
                          <span className="font-medium text-yellow-600">
                            {stats.eventStats?.find(e => e._id === 'pending')?.count || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Active Users</span>
                          <span className="font-medium text-blue-600">{totalUsers}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Weekly Growth</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {stats.recentActivity?.events > 0 ? '+' : ''}{stats.recentActivity?.events || 0}
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">New Events</span>
                            <span className="font-medium">{stats.recentActivity?.events || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ 
                                width: `${Math.min(((stats.recentActivity?.events || 0) / Math.max(totalEvents, 1)) * 300, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">New Registrations</span>
                            <span className="font-medium">{stats.recentActivity?.registrations || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ 
                                width: `${Math.min(((stats.recentActivity?.registrations || 0) / Math.max(totalUsers * 2, 1)) * 300, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Approval Rate</span>
                            <span className="font-medium">
                              {totalEvents > 0 ? 
                                Math.round(((stats.eventStats?.find(e => e._id === 'approved')?.count || 0) / totalEvents) * 100) : 0
                              }%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow border">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">User Distribution</h3>
                      <p className="text-3xl font-bold text-green-600">{totalUsers}</p>
                      <div className="mt-3 space-y-2">
                        {stats.userStats?.map(stat => {
                          const percentage = totalUsers > 0 ? Math.round((stat.count / totalUsers) * 100) : 0;
                          const color = stat._id === 'admin' ? 'bg-red-500' : 
                                       stat._id === 'organizer' ? 'bg-blue-500' : 
                                       'bg-green-500';
                          
                          return (
                            <div key={stat._id} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 capitalize">{stat._id}s</span>
                                <span className="font-medium">{stat.count} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`${color} h-2 rounded-full`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow border">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Popular Categories</h3>
                      <div className="space-y-3">
                        {stats.popularCategories?.slice(0, 3).map(cat => {
                          const percentage = totalEvents > 0 ? Math.round((cat.count / totalEvents) * 100) : 0;
                          return (
                            <div key={cat._id} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <span className="text-gray-600 capitalize text-sm">{cat._id}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="font-medium text-sm mr-2">{cat.count}</span>
                                  <span className="text-xs text-gray-500">({percentage}%)</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-500 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                        {stats.popularCategories?.length > 3 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500 text-center">
                              +{stats.popularCategories.length - 3} more categories
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                      to="/events/create"
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors block"
                    >
                      <h3 className="font-medium text-gray-900">Create New Event</h3>
                      <p className="text-sm text-gray-600 mt-1">Admins can create unlimited events</p>
                    </Link>
                    <Link
                      to="/events"
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors block"
                    >
                      <h3 className="font-medium text-gray-900">Browse All Events</h3>
                      <p className="text-sm text-gray-600 mt-1">View and manage all system events</p>
                    </Link>
                    <button
                      onClick={() => {
                        setActiveTab('analytics');
                        loadComprehensiveAnalytics();
                      }}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      <h3 className="font-medium text-gray-900">View Analytics</h3>
                      <p className="text-sm text-gray-600 mt-1">Comprehensive system analytics</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && renderAnalyticsTab()}

            {activeTab === 'pending' && (
              <PendingEventsTab
                pendingEvents={pendingEvents}
                pendingCount={pendingCount}
                onApprove={handleApprove}
                onReject={handleReject}
                onDeleteEvent={handleDeleteEvent}
              />
            )}

            {activeTab === 'all-events' && (
              <AllEventsTab
                events={allEvents}
                pendingEvents={pendingEvents}
                onDeleteEvent={handleDeleteEvent}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

// Pending Events Tab Component
const PendingEventsTab = ({ 
  pendingEvents, 
  pendingCount,
  onApprove,
  onReject,
  onDeleteEvent
}) => {
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [rejectingEventId, setRejectingEventId] = useState(null);

  if (pendingEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-5xl mb-4">🎉</div>
        <p className="text-gray-500 text-lg">No pending events for approval</p>
        <p className="text-gray-400 text-sm mt-2">All events have been processed</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Pending Event Approvals ({pendingEvents.length})
        </h2>
        <div className="flex items-center space-x-4">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            {pendingCount} Total Pending
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {pendingEvents.map(event => (
          <div key={event._id} className="border rounded-lg p-6 bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                <p className="text-gray-600 mt-1">{event.description}</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Pending
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
              <div>
                <strong>Category:</strong> {event.category}
              </div>
              <div>
                <strong>Date:</strong> {formatDate(event.date)}
              </div>
              <div>
                <strong>Location:</strong> {event.location}
              </div>
              <div>
                <strong>Max Attendees:</strong> {event.maxAttendees}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <strong>Proposed by:</strong> {event.creator?.firstName} {event.creator?.lastName} 
              ({event.creator?.studentId || 'Unknown'})
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onApprove(event._id)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white rounded-md hover:shadow-lg hover:shadow-green-400/40 transition-all duration-300 font-semibold hover:scale-105 active:scale-95 text-sm"
              >
                Approve Event
              </button>
              
              {rejectingEventId === event._id ? (
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                  <button
                    onClick={() => {
                      onReject(event._id, rejectionNotes);
                      setRejectingEventId(null);
                      setRejectionNotes('');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Confirm Reject
                  </button>
                  <button
                    onClick={() => {
                      setRejectingEventId(null);
                      setRejectionNotes('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setRejectingEventId(event._id)}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white rounded-md hover:shadow-lg hover:shadow-red-400/40 transition-all duration-300 font-semibold hover:scale-105 active:scale-95 text-sm"
                >
                  Reject Event
                </button>
              )}

              <button
                onClick={() => onDeleteEvent(event._id, event.title, event.status)}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-black transition-colors text-sm"
                title="Admin: Delete this event"
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete (Admin)
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// All Events Tab Component
const AllEventsTab = ({ events, pendingEvents, onDeleteEvent, onApprove, onReject }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No events in the system.</p>
      </div>
    );
  }

  const isPending = (eventId) => {
    return pendingEvents.some(e => e._id === eventId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">All System Events ({events.length})</h3>
        <p className="text-sm text-gray-600">Admin can delete any event regardless of status</p>
      </div>

      {events.map(event => (
        <div key={event._id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  event.status === 'approved' ? 'bg-green-100 text-green-800' :
                  event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  event.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {event.status}
                </span>
                {isPending(event._id) && (
                  <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs">
                    ⏳ Pending Approval
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mt-1 line-clamp-1">{event.description}</p>
              
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                <span>📅 {formatDate(event.date)}</span>
                <span>📍 {event.location}</span>
                <span>👥 {event.currentAttendees || 0}/{event.maxAttendees}</span>
                <span>👤 {event.creator?.firstName || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <button
                onClick={() => onDeleteEvent(event._id, event.title, event.status)}
                className="px-3 py-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white rounded text-sm hover:shadow-lg hover:shadow-red-400/40 transition-all duration-300 font-semibold hover:scale-105 active:scale-95 flex items-center"
                title="Admin: Delete this event"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>

              {isPending(event._id) && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => onApprove(event._id)}
                    className="px-2 py-1 bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white rounded hover:shadow-lg hover:shadow-green-400/40 transition-all duration-300 font-semibold hover:scale-105 active:scale-95 text-xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) onReject(event._id, reason);
                    }}
                    className="px-2 py-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white rounded hover:shadow-lg hover:shadow-red-400/40 transition-all duration-300 font-semibold hover:scale-105 active:scale-95 text-xs"
                  >
                    Reject
                  </button>
                </div>
              )}

              <Link
                to={`/events/${event._id}`}
                className="px-3 py-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white rounded text-sm hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-300 font-semibold hover:scale-105 active:scale-95 text-xs"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;