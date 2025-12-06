import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsService } from '../../services/events';
import { toast } from 'react-hot-toast';
import { Search, Filter, Calendar, MapPin, Users, RefreshCw, ChevronDown, Sparkles, TrendingUp } from 'lucide-react';

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    page: 1
  });
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['academic', 'cultural', 'sports', 'workshop', 'seminar', 'social', 'other'];
  const [sortBy, setSortBy] = useState('upcoming');

  useEffect(() => {
    loadEvents();
  }, [filters]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadEvents = async () => {
    try {
      const result = await eventsService.getEvents(filters);
      if (result.success) {
        setEvents(result.data.events);
      }
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = async () => {
    setLoading(true);
    try {
      const result = await eventsService.getEvents(filters);
      if (result.success) {
        setEvents(result.data.events);
      }
    } catch (error) {
      toast.error('Failed to refresh events');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category === activeCategory ? '' : category);
    handleFilterChange('category', category === activeCategory ? '' : category);
  };

  useEffect(() => {
    if (events.length > 0) {
      const interval = setInterval(() => {
        refreshEvents();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [events.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-[#0A2FF1] rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Header Section */}
      <div className="relative z-10 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Text */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-[#0A2FF1]" />
              <span className="text-sm font-semibold text-[#0A2FF1] bg-blue-100 px-3 py-1 rounded-full">
                {events.length} Events Available
              </span>
              <Sparkles className="w-6 h-6 text-[#0A2FF1]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
              Discover Events
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Explore and register for amazing university events happening around campus
            </p>
          </div>

          {/* Filters Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4 lg:p-6 mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-[#0A2FF1]" />
              <h2 className="text-base font-semibold text-gray-900">Filter Events</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
              {/* Search Input */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Events
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 group-focus-within:text-[#0A2FF1] transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by title, description, or tags..."
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-300 text-sm font-medium bg-gray-50/50 hover:border-gray-300 focus:border-[#0A2FF1] focus:bg-blue-50/50 focus:shadow-lg focus:shadow-blue-200/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-400 group-focus-within:text-[#0A2FF1] transition-colors" />
                  </div>
                  <select
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-300 text-sm font-medium appearance-none bg-gray-50/50 hover:border-gray-300 focus:border-[#0A2FF1] focus:bg-blue-50/50 focus:shadow-lg focus:shadow-blue-200/50"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Category Quick Filters */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Quick Filters</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                      activeCategory === category
                        ? 'bg-gradient-to-r from-[#0A2FF1] to-[#0818A8] text-white shadow-lg shadow-blue-400/50 scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                onClick={() => {
                  setFilters({ category: '', search: '', page: 1 });
                  setActiveCategory('');
                }}
                className="px-4 py-2 text-sm font-semibold text-[#0A2FF1] hover:text-[#0818A8] hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                ✕ Clear Filters
              </button>
              <button
                onClick={refreshEvents}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0A2FF1] to-[#0818A8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-300 text-sm font-semibold hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-[#0A2FF1]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600">Try adjusting your search filters to find more events</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

// Event Card Component
const EventCard = ({ event }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      day: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  const { date, time, day } = formatDate(event.date);
  const categoryColors = {
    workshop: { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-500' },
    seminar: { bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-500' },
    cultural: { bg: 'bg-purple-100', text: 'text-purple-700', badge: 'bg-purple-500' },
    sports: { bg: 'bg-orange-100', text: 'text-orange-700', badge: 'bg-orange-500' },
    academic: { bg: 'bg-indigo-100', text: 'text-indigo-700', badge: 'bg-indigo-500' },
    social: { bg: 'bg-pink-100', text: 'text-pink-700', badge: 'bg-pink-500' },
    other: { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'bg-gray-500' }
  };

  const colors = categoryColors[event.category] || categoryColors.other;
  const availableSlots = (event.maxAttendees || 0) - (event.currentAttendees || 0);
  const capacityPercentage = ((event.currentAttendees || 0) / (event.maxAttendees || 1)) * 100;

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl hover:border-blue-200/50 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
    >
      {/* Event Banner */}
      <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
        {event.bannerImage ? (
          <img 
            src={`http://localhost:5000${event.bannerImage}`} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full ${colors.bg} flex items-center justify-center relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10"></div>
            <Calendar className={`w-12 h-12 ${colors.text} opacity-50 relative z-10`} />
          </div>
        )}

        {/* Overlay on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 right-3 transform transition-transform duration-300 group-hover:scale-110">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${colors.badge} shadow-lg`}>
            {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
          </span>
        </div>

        {/* Registration Closed Badge */}
        {event.registrationClosed && (
          <div className="absolute top-3 left-3 animate-pulse">
            <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold shadow-lg">
              Closed
            </span>
          </div>
        )}

        {/* Trending indicator for high attendance */}
        {capacityPercentage > 75 && (
          <div className="absolute bottom-3 right-3">
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-semibold text-orange-600">
              <TrendingUp className="w-3 h-3" />
              Popular
            </div>
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#0A2FF1] transition-colors duration-200">
          {event.title}
        </h3>

        {/* Description */}
        <p className={`text-gray-600 text-sm mb-4 transition-all duration-300 ${isHovered ? 'line-clamp-3' : 'line-clamp-2'}`}>
          {event.description}
        </p>

        {/* Capacity Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Capacity</span>
            <span className="text-xs font-semibold text-gray-600">{Math.round(capacityPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                capacityPercentage > 90 ? 'from-red-500 to-red-600' :
                capacityPercentage > 75 ? 'from-orange-500 to-orange-600' :
                'from-[#0A2FF1] to-[#0818A8]'
              }`}
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3 hover:bg-blue-50/50 p-2 rounded-lg transition-colors duration-200">
            <Calendar className="w-4 h-4 text-[#0A2FF1] mt-0.5 flex-shrink-0 group-hover:animate-bounce" />
            <div>
              <p className="text-xs font-semibold text-gray-900">{day}, {date}</p>
              <p className="text-xs text-gray-600">{time}</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3 hover:bg-blue-50/50 p-2 rounded-lg transition-colors duration-200">
            <MapPin className="w-4 h-4 text-[#0A2FF1] mt-0.5 flex-shrink-0 group-hover:animate-pulse" />
            <p className="text-sm text-gray-600 line-clamp-1">{event.location}</p>
          </div>

          {/* Attendees */}
          <div className="flex items-start gap-3 hover:bg-blue-50/50 p-2 rounded-lg transition-colors duration-200">
            <Users className="w-4 h-4 text-[#0A2FF1] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-900">{event.currentAttendees || 0} registered</p>
              <p className="text-xs text-gray-600">{availableSlots} slots {availableSlots <= 5 ? '⚡ running out' : 'available'}</p>
            </div>
          </div>
        </div>

        {/* Organizer */}
        <div className="flex items-center gap-2 py-3 border-t border-gray-100 hover:bg-gray-50/50 px-1 rounded transition-colors duration-200">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0A2FF1] to-[#0818A8] flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white shadow-md">
            {event.creator?.firstName?.charAt(0)}{event.creator?.lastName?.charAt(0)}
          </div>
          <div>
            <p className="text-xs text-gray-600">
              By <span className="font-semibold text-gray-900 group-hover:text-[#0A2FF1] transition-colors">{event.creator?.firstName} {event.creator?.lastName}</span>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/events/${event._id}`}
          className={`mt-4 block w-full py-2.5 text-center rounded-lg font-semibold text-sm transition-all duration-300 ${
            event.registrationClosed
              ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#0A2FF1] to-[#0818A8] text-white hover:shadow-lg hover:shadow-blue-400/50 hover:scale-105 active:scale-95'
          }`}
        >
          {event.registrationClosed ? 'Registration Closed' : 'View Details'}
        </Link>
      </div>
    </div>
  );
};

export default BrowseEvents;