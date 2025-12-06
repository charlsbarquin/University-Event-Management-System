import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService } from '../../services/events';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Tag, 
  ArrowLeft, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Lock,
  FileText,
  TrendingUp,
  Zap,
  ExternalLink
} from 'lucide-react';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [userRegistration, setUserRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const [accessDenied, setAccessDenied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState('');

  useEffect(() => {
    loadEventDetails();
  }, [id]);

  const loadEventDetails = async () => {
    try {
      console.log('Loading event details for ID:', id);
      const result = await eventsService.getEvent(id);
      console.log('Event details response:', result);
      
      if (result.success) {
        const eventData = result.data.event;
        console.log('Event data loaded:', eventData);
        
        setEvent(eventData);
        setUserRegistration(result.data.userRegistration);
        setAccessDenied(false);
      } else {
        if (result.message?.includes('Access denied') || 
            result.message?.includes('Authentication required') ||
            result.message?.includes('403')) {
          setAccessDenied(true);
          toast.error('Access denied to this event');
        } else {
          toast.error('Event not found');
          navigate('/events');
        }
      }
    } catch (error) {
      console.error('Error loading event:', error);
      
      if (error.response?.status === 403) {
        setAccessDenied(true);
        toast.error('Access denied to this event');
      } else {
        toast.error('Failed to load event details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const result = await eventsService.registerForEvent(id);
      
      if (result.success) {
        toast.success('Successfully registered for the event!');
        
        if (result.data && result.data.registration) {
          setUserRegistration(result.data.registration);
        }
        
        if (result.data && result.data.event) {
          setEvent(result.data.event);
        } else {
          loadEventDetails();
        }
      } else {
        toast.error(result.message || 'Failed to register');
      }
    } catch (error) {
      console.error('Registration error details:', error.response?.data || error);
      toast.error('Failed to register for event');
    }
  };

  const handleUnregister = async () => {
    if (!window.confirm('Are you sure you want to unregister from this event?')) {
      return;
    }

    try {
      const result = await eventsService.unregisterFromEvent(id);
      
      if (result.success) {
        toast.success('Successfully unregistered from the event');
        setUserRegistration(null);
        
        if (result.data && result.data.event) {
          setEvent(result.data.event);
        } else {
          loadEventDetails();
        }
      } else {
        toast.error(result.message || 'Failed to unregister');
      }
    } catch (error) {
      console.error('Unregister error:', error);
      toast.error('Failed to unregister from event');
    }
  };

  const handleImageError = (imageUrl, index, type = 'gallery') => {
    setImageErrors(prev => ({
      ...prev,
      [`${type}-${index}`]: true
    }));
  };

  const openLightbox = (type, index) => {
    setLightboxType(type);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    if (!event || !event.images) return;
    setLightboxIndex((lightboxIndex + 1) % event.images.length);
  };

  const prevImage = () => {
    if (!event || !event.images) return;
    setLightboxIndex((lightboxIndex - 1 + event.images.length) % event.images.length);
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    
    let imageUrl = url;
    if (url.startsWith('/uploads/')) {
      imageUrl = `http://localhost:5000${url}`;
    } else if (!url.startsWith('http')) {
      imageUrl = `http://localhost:5000/uploads/event-images/${url}`;
    }
    
    return `${imageUrl}?t=${Date.now()}`;
  };

  const getLightboxMedia = () => {
    if (lightboxType === 'banner') {
      return { url: event.bannerImage, type: 'banner' };
    } else if (lightboxType === 'gallery' && event.images && event.images.length > 0) {
      return event.images[lightboxIndex];
    }
    return null;
  };

  const formatEventDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date not specified';
      
      return {
        full: date.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        short: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        day: date.toLocaleDateString('en-US', { weekday: 'short' })
      };
    } catch (error) {
      return {
        full: 'Date not specified',
        short: 'Date not specified',
        time: '',
        day: ''
      };
    }
  };

  const calculateAvailableSlots = () => {
    if (!event) return 0;
    
    const maxSlots = event.maxAttendees || 0;
    const currentAttendees = event.currentAttendees || 0;
    const available = maxSlots - currentAttendees;
    
    return available > 0 ? available : 0;
  };

  const categoryColors = {
    workshop: { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-500' },
    seminar: { bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-500' },
    cultural: { bg: 'bg-purple-100', text: 'text-purple-700', badge: 'bg-purple-500' },
    sports: { bg: 'bg-orange-100', text: 'text-orange-700', badge: 'bg-orange-500' },
    academic: { bg: 'bg-indigo-100', text: 'text-indigo-700', badge: 'bg-indigo-500' },
    social: { bg: 'bg-pink-100', text: 'text-pink-700', badge: 'bg-pink-500' },
    other: { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'bg-gray-500' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-[#0A2FF1] rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading event details...</p>
        </div>
      </div>
    );
  }
  
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">You don't have permission to view this event.</p>
            <button
              onClick={() => navigate('/events')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0A2FF1] to-[#0818A8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-300 font-semibold hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0A2FF1] to-[#0818A8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-300 font-semibold hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const isRegistered = userRegistration && (
    !userRegistration.status || 
    userRegistration.status === 'registered' || 
    userRegistration.status === 'attended'
  );

  const availableSlots = calculateAvailableSlots();
  const capacityPercentage = ((event.currentAttendees || 0) / (event.maxAttendees || 1)) * 100;
  const formattedDate = formatEventDate(event.date);
  const colors = categoryColors[event.category] || categoryColors.other;
  const isPopular = capacityPercentage > 75;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section with Back Button */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/events')}
              className="flex items-center gap-2 text-[#0A2FF1] hover:text-[#0818A8] font-semibold transition-colors duration-200 mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Events
            </button>
            
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-6 h-6 text-[#0A2FF1]" />
                <span className="text-sm font-semibold text-[#0A2FF1] bg-blue-100 px-3 py-1 rounded-full">
                  Event Details
                </span>
                <Sparkles className="w-6 h-6 text-[#0A2FF1]" />
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                {event.title || 'Untitled Event'}
              </h1>
              <p className="text-gray-600 text-sm max-w-3xl mx-auto">
                {event.category ? event.category.charAt(0).toUpperCase() + event.category.slice(1) : 'Event'} • {formattedDate.short}
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Event Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Banner */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                <div className="h-96 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
                  {event.bannerImage ? (
                    <div 
                      className="w-full h-full cursor-pointer"
                      onClick={() => openLightbox('banner', 0)}
                    >
                      <img 
                        src={getImageUrl(event.bannerImage)}
                        alt={event.title || 'Event banner'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        onError={() => handleImageError(event.bannerImage, 0, 'banner')}
                      />
                    </div>
                  ) : (
                    <div className={`w-full h-full ${colors.bg} flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10"></div>
                      <Calendar className={`w-16 h-16 ${colors.text} opacity-50 relative z-10`} />
                    </div>
                  )}
                  
                  {event.registrationClosed && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="text-center text-white p-6 backdrop-blur-sm rounded-2xl">
                        <Lock className="w-12 h-12 mx-auto mb-3" />
                        <h3 className="text-2xl font-bold mb-2">Registration Closed</h3>
                        <p className="text-gray-300">No new registrations are being accepted</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-1 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-sm font-semibold text-orange-600">
                        <TrendingUp className="w-4 h-4" />
                        Trending Event
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 lg:p-8">
                  {/* Category and Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    {event.category && (
                      <span className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm ${colors.badge} text-white`}>
                        {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                      </span>
                    )}
                    
                    {event.status && (
                      <span className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                        event.status === 'approved' ? 'bg-green-500 text-white' :
                        event.status === 'draft' ? 'bg-gray-500 text-white' :
                        event.status === 'pending' ? 'bg-yellow-500 text-white' :
                        event.status === 'rejected' ? 'bg-red-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    )}
                  </div>

                  {/* Event Description */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#0A2FF1]" />
                      About This Event
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                        {event.description || 'No description available.'}
                      </p>
                    </div>
                  </div>

                  {/* Event Gallery */}
                  {event.images && event.images.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#0A2FF1]" />
                        Event Gallery
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {event.images.map((image, index) => {
                          const imageUrl = image.url || image;
                          const hasError = imageErrors[`gallery-${index}`];
                          
                          return (
                            <div key={index} className="relative group">
                              {hasError ? (
                                <div className="w-full h-32 bg-gray-100 rounded-xl flex flex-col items-center justify-center">
                                  <span className="text-gray-500 text-sm">Image failed to load</span>
                                </div>
                              ) : (
                                <div 
                                  className="cursor-pointer"
                                  onClick={() => openLightbox('gallery', index)}
                                >
                                  <img
                                    src={getImageUrl(imageUrl)}
                                    alt={`Event image ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md border border-white/20"
                                    onError={() => handleImageError(imageUrl, index, 'gallery')}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#0A2FF1]" />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Event Info & Actions */}
            <div className="space-y-8">
              {/* Event Info Card */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0A2FF1]" />
                  Event Information
                </h3>
                
                <div className="space-y-6">
                  {/* Date & Time */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">Date & Time</h4>
                    <div className="flex items-start gap-3 hover:bg-blue-50/50 p-3 rounded-lg transition-colors duration-200">
                      <Calendar className="w-4 h-4 text-[#0A2FF1] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formattedDate.day}, {formattedDate.short}</p>
                        <p className="text-sm text-gray-600">{formattedDate.time}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">Location</h4>
                    <div className="flex items-start gap-3 hover:bg-blue-50/50 p-3 rounded-lg transition-colors duration-200">
                      <MapPin className="w-4 h-4 text-[#0A2FF1] mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{event.location || 'Location not specified'}</p>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">Capacity</h4>
                    <div className="flex items-start gap-3 hover:bg-blue-50/50 p-3 rounded-lg transition-colors duration-200">
                      <Users className="w-4 h-4 text-[#0A2FF1] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {event.currentAttendees || 0} / {event.maxAttendees || 0} attendees
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{availableSlots} slots available</p>
                      </div>
                    </div>
                    
                    {/* Capacity Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            capacityPercentage > 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            capacityPercentage > 75 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                            'bg-gradient-to-r from-[#0A2FF1] to-[#0818A8]'
                          }`}
                          style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>0%</span>
                        <span className="font-semibold">{Math.round(capacityPercentage)}% filled</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Organizer */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">Organizer</h4>
                    <div className="flex items-start gap-3 hover:bg-blue-50/50 p-3 rounded-lg transition-colors duration-200">
                      <Sparkles className="w-4 h-4 text-[#0A2FF1] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {event.organizer ? 
                            `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() :
                            event.creator ? 
                              `${event.creator.firstName || ''} ${event.creator.lastName || ''}`.trim() :
                              'Unknown organizer'
                          }
                        </p>
                        {user?.role === 'admin' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Email: {event.creator?.email || 'Not available'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Card */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#0A2FF1]" />
                  Event Actions
                </h3>

                {/* Registration Status */}
                {isAuthenticated && event.status === 'approved' ? (
                  <div className="space-y-4">
                    {isRegistered ? (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-semibold text-green-700">You're Registered</span>
                          </div>
                          <p className="text-xs text-green-600">
                            You've successfully registered for this event. Don't forget to attend!
                          </p>
                        </div>
                        
                        <button
                          onClick={handleUnregister}
                          className="w-full px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:shadow-lg transition-all duration-300 text-sm font-semibold hover:scale-105 active:scale-95"
                          disabled={event.registrationClosed}
                        >
                          Unregister from Event
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {availableSlots > 0 ? (
                          <button
                            onClick={handleRegister}
                            className={`w-full px-4 py-2.5 rounded-lg transition-all duration-300 text-sm font-semibold ${
                              event.registrationClosed 
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none' 
                                : 'bg-gradient-to-r from-[#0A2FF1] to-[#0818A8] text-white hover:shadow-lg hover:shadow-blue-400/40 hover:scale-105 active:scale-95'
                            }`}
                            disabled={event.registrationClosed}
                            title={event.registrationClosed ? 'Registration is closed for this event' : ''}
                          >
                            {event.registrationClosed ? 'Registration Closed' : 'Register Now'}
                          </button>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <span className="text-sm font-semibold text-red-700">Event Full</span>
                            </div>
                            <p className="text-xs text-red-600">
                              This event has reached maximum capacity. Try other events instead.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : !isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-blue-700">
                        Please sign in to register for this event
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-[#0A2FF1] to-[#0818A8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-300 text-sm font-semibold hover:scale-105 active:scale-95"
                    >
                      Sign In to Register
                    </button>
                  </div>
                ) : event.status !== 'approved' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-yellow-700">Event Not Ready</span>
                    </div>
                    <p className="text-xs text-yellow-600">
                      This event is {event.status}. Registration will open once approved.
                    </p>
                  </div>
                )}

                {/* Share Event */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Share Event</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Event link copied to clipboard!');
                      }}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-xs font-medium"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-xs font-medium"
                    >
                      Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Rejection Notes for Rejected Events */}
              {event.status === 'rejected' && event.approvalNotes && (
                <div className="bg-red-50/80 backdrop-blur-sm rounded-2xl border-l-4 border-red-500 shadow-lg p-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-red-800 text-sm mb-1">Rejection Reason</h4>
                      <p className="text-red-700 text-sm">{event.approvalNotes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lightbox Modal */}
        {lightboxOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh]">
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 text-white z-10 hover:text-gray-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              
              {/* Navigation arrows (for gallery) */}
              {lightboxType === 'gallery' && event.images && event.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white z-10 hover:text-gray-300 transition-colors"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white z-10 hover:text-gray-300 transition-colors"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
              
              {/* Media display */}
              <div className="flex items-center justify-center h-full">
                {getLightboxMedia() && (
                  <img
                    src={getImageUrl(getLightboxMedia()?.url)}
                    alt="Full screen view"
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                )}
              </div>
              
              {/* Caption */}
              {getLightboxMedia()?.caption && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white bg-black bg-opacity-75 backdrop-blur-sm inline-block px-4 py-2 rounded-lg">
                    {getLightboxMedia()?.caption}
                  </p>
                </div>
              )}
              
              {/* Counter for gallery */}
              {lightboxType === 'gallery' && event.images && (
                <div className="absolute bottom-4 right-4 text-white bg-black bg-opacity-75 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold">
                  {lightboxIndex + 1} / {event.images.length}
                </div>
              )}
            </div>
          </div>
        )}

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
    </div>
  );
};

export default EventDetails;