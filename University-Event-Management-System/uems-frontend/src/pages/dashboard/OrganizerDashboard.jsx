import React, { useState, useEffect } from 'react';
import { eventsService } from '../../services/events';
import { sharingService } from '../../services/sharing';
import { uploadService } from '../../services/upload';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import FileUploadModal from '../../components/upload/FileUploadModal';
import MediaGallery from '../../components/upload/MediaGallery';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, FileText, Bell, Plus, Clock, CheckCircle, X, Eye, Trash2, Send, ChevronRight, Sparkles, Zap, BarChart3, Image, Users as UsersIcon } from 'lucide-react';
import { getImageUrl } from '../../services/api';

const OrganizerDashboard = () => {
  const [myEvents, setMyEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('events');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadEventId, setUploadEventId] = useState(null);
  const [uploadMediaType, setUploadMediaType] = useState(null);

  useEffect(() => {
    loadOrganizerEvents();
  }, []);

  const loadOrganizerEvents = async () => {
    try {
      console.log('🔍 Loading organizer events for user:', user._id);
      const result = await eventsService.getMyProposals();
      
      console.log('🔍 API Response:', {
        success: result.success,
        message: result.message,
        eventsCount: result.data?.events?.length || 0
      });
      
      if (result.success) {
        // ✅ FIXED: Show ALL user's events (drafts, pending, approved, rejected)
        const userEvents = result.data.events.filter(event => 
          event.creator._id === user._id || event.organizer?._id === user._id
        );
        
        console.log('✅ User events (all statuses):', userEvents.length);
        
        // Debug events by status
        const statusCounts = {};
        userEvents.forEach(event => {
          statusCounts[event.status] = (statusCounts[event.status] || 0) + 1;
        });
        console.log('📊 Events by status:', statusCounts);
        
        setMyEvents(userEvents);
      } else {
        toast.error(result.message || 'Failed to load your events');
      }
    } catch (error) {
      console.error('❌ Error loading organizer events:', error);
      toast.error('Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Handle registration closure
  const handleCloseRegistration = async (eventId, eventTitle) => {
    if (!window.confirm(`Close registration for "${eventTitle}"?\n\nThis will prevent new registrations but existing registrations remain.`)) {
      return;
    }

    try {
      const result = await eventsService.closeRegistration(eventId);
      if (result.success) {
        toast.success('Registration closed successfully');
        // Update the event in local state
        setMyEvents(prevEvents => 
          prevEvents.map(event => 
            event._id === eventId 
              ? { 
                  ...event, 
                  registrationClosed: true,
                  closedAt: new Date().toISOString()
                } 
              : event
          )
        );
      } else {
        toast.error(result.message || 'Failed to close registration');
      }
    } catch (error) {
      console.error('Error closing registration:', error);
      toast.error(error.response?.data?.message || 'Failed to close registration');
    }
  };

  // ✅ NEW: Handle registration opening
  const handleOpenRegistration = async (eventId, eventTitle) => {
    if (!window.confirm(`Re-open registration for "${eventTitle}"?\n\nThis will allow new registrations again.`)) {
      return;
    }

    try {
      const result = await eventsService.openRegistration(eventId);
      if (result.success) {
        toast.success('Registration opened successfully');
        // Update the event in local state
        setMyEvents(prevEvents => 
          prevEvents.map(event => 
            event._id === eventId 
              ? { 
                  ...event, 
                  registrationClosed: false,
                  closedAt: null
                } 
              : event
          )
        );
      } else {
        toast.error(result.message || 'Failed to open registration');
      }
    } catch (error) {
      console.error('Error opening registration:', error);
      toast.error(error.response?.data?.message || 'Failed to open registration');
    }
  };

  // ✅ FIX: Update specific event after media delete
  const handleMediaUpdated = (updatedEvent) => {
    console.log('🔄 Updating event after media change:', updatedEvent._id);
    setMyEvents(prevEvents => 
      prevEvents.map(event => 
        event._id === updatedEvent._id ? updatedEvent : event
      )
    );
    toast.success('Media updated successfully');
  };

  const handleGenerateShareLink = async (eventId) => {
    try {
      const result = await sharingService.generateShareLinks(eventId);
      if (result.success) {
        navigator.clipboard.writeText(result.data.shareUrl);
        toast.success('Share link copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  const handleUploadClick = (eventId, mediaType) => {
    setUploadEventId(eventId);
    setUploadMediaType(mediaType);
    setShowUploadModal(true);
  };

  const handleUploadComplete = () => {
    loadOrganizerEvents();
  };

  // ✅ FIXED: Delete draft, pending, or rejected proposal - UPDATED FOR ORGANIZER PERMISSIONS
  const handleDeleteProposal = async (proposalId, eventTitle, status) => {
    let confirmMessage = '';
    
    if (status === 'draft') {
      confirmMessage = `Are you sure you want to delete the draft "${eventTitle}"? This cannot be undone.`;
    } else if (status === 'pending') {
      confirmMessage = `Are you sure you want to delete the pending event "${eventTitle}"? This cannot be undone.`;
    } else if (status === 'rejected') {
      confirmMessage = `Are you sure you want to delete the rejected event "${eventTitle}"? This cannot be undone.`;
    }
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await eventsService.deleteProposal(proposalId);
      if (result.success) {
        toast.success(`Successfully deleted ${status === 'draft' ? 'draft' : status === 'pending' ? 'pending event' : 'rejected event'}`);
        // Remove from local state immediately
        setMyEvents(prev => prev.filter(event => event._id !== proposalId));
      } else {
        toast.error(result.message || `Failed to delete ${status === 'draft' ? 'draft' : 'event'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || `Failed to delete ${status === 'draft' ? 'draft' : 'event'}`);
    }
  };

  // ✅ NEW: Delete approved event
  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete the approved event "${eventTitle}"?\n\nThis will:\n• Permanently delete the event\n• Remove all registrations\n• Delete all uploaded media\n• This action cannot be undone!`)) {
      return;
    }

    try {
      const result = await eventsService.deleteEvent(eventId);
      if (result.success) {
        toast.success('✅ Approved event deleted successfully');
        // Remove from local state immediately
        setMyEvents(prev => prev.filter(event => event._id !== eventId));
      } else {
        toast.error(result.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Delete event error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  // ✅ NEW: Submit draft for approval
  const handleSubmitProposal = async (eventId, eventTitle) => {
    if (!window.confirm(`Submit "${eventTitle}" for admin approval?`)) {
      return;
    }

    try {
      const result = await eventsService.submitProposal(eventId);
      if (result.success) {
        toast.success('Event submitted for admin approval!');
        // Update the event status in local state
        setMyEvents(prevEvents => 
          prevEvents.map(event => 
            event._id === eventId 
              ? { ...event, status: 'pending' } 
              : event
          )
        );
      } else {
        toast.error(result.message || 'Failed to submit proposal');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit proposal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-[#0A2FF1] rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading your events...</p>
        </div>
      </div>
    );
  }

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
                Organizer Dashboard
              </span>
              <Sparkles className="w-6 h-6 text-[#0A2FF1]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight leading-tight">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Manage your events, track attendance, and analyze performance
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Events Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-7 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0A2FF1] to-[#0818A8] rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{myEvents.length}</p>
                </div>
              </div>
            </div>

            {/* Live Events Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-7 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Live Events</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {myEvents.filter(e => e.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Registrations Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-7 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {myEvents.reduce((acc, event) => acc + (event.currentAttendees || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Closed Registrations Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-7 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-400 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Closed Registrations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {myEvents.filter(e => e.status === 'approved' && e.registrationClosed).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Create Event Button */}
          <div className="flex justify-end mb-6">
            <Link
              to="/events/create"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0A2FF1] via-[#1a4af8] to-[#0818A8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create New Event
            </Link>
          </div>

          {/* Main Content Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-white/20">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('events')}
                  className={`flex-1 py-5 px-6 text-center font-medium text-sm transition-all duration-500 relative ${
                    activeTab === 'events'
                      ? 'text-[#0A2FF1] bg-gradient-to-b from-blue-50/50 to-transparent'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5" />
                    My Events
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {myEvents.length}
                    </span>
                  </div>
                  {activeTab === 'events' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0A2FF1] to-[#0818A8]"></div>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`flex-1 py-5 px-6 text-center font-medium text-sm transition-all duration-500 relative ${
                    activeTab === 'attendance'
                      ? 'text-[#0A2FF1] bg-gradient-to-b from-blue-50/50 to-transparent'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <UsersIcon className="w-5 h-5" />
                    Attendance
                  </div>
                  {activeTab === 'attendance' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0A2FF1] to-[#0818A8]"></div>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex-1 py-5 px-6 text-center font-medium text-sm transition-all duration-500 relative ${
                    activeTab === 'analytics'
                      ? 'text-[#0A2FF1] bg-gradient-to-b from-blue-50/50 to-transparent'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Analytics
                  </div>
                  {activeTab === 'analytics' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0A2FF1] to-[#0818A8]"></div>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('media')}
                  className={`flex-1 py-5 px-6 text-center font-medium text-sm transition-all duration-500 relative ${
                    activeTab === 'media'
                      ? 'text-[#0A2FF1] bg-gradient-to-b from-blue-50/50 to-transparent'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Image className="w-5 h-5" />
                    Media Library
                  </div>
                  {activeTab === 'media' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0A2FF1] to-[#0818A8]"></div>
                  )}
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'events' && (
                <EventsTab
                  events={myEvents}
                  onGenerateShareLink={handleGenerateShareLink}
                  onUploadClick={handleUploadClick}
                  onSelectEvent={setSelectedEvent}
                  onMediaUpdated={handleMediaUpdated}
                  onDeleteProposal={handleDeleteProposal}
                  onDeleteEvent={handleDeleteEvent}
                  onSubmitProposal={handleSubmitProposal}
                  onCloseRegistration={handleCloseRegistration}
                  onOpenRegistration={handleOpenRegistration}
                />
              )}
              {activeTab === 'attendance' && (
                <AttendanceTab
                  events={myEvents}
                />
              )}
              {activeTab === 'analytics' && (
                <AnalyticsTab events={myEvents} />
              )}
              {activeTab === 'media' && (
                <MediaLibraryTab
                  events={myEvents}
                  onDeleteProposal={handleDeleteProposal}
                  onDeleteEvent={handleDeleteEvent}
                />
              )}
            </div>
          </div>

          {/* File Upload Modal */}
          {showUploadModal && (
            <FileUploadModal
              eventId={uploadEventId}
              mediaType={uploadMediaType}
              onClose={() => {
                setShowUploadModal(false);
                setUploadEventId(null);
                setUploadMediaType(null);
              }}
              onUploadComplete={handleUploadComplete}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.95); }
        }
        .animate-blob {
          animation: blob 10s infinite ease-in-out;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </div>
  );
};

// Events Management Tab - UPDATED WITH REGISTRATION CONTROL
const EventsTab = ({ 
  events, 
  onGenerateShareLink, 
  onUploadClick, 
  onSelectEvent, 
  onMediaUpdated,
  onDeleteProposal,
  onDeleteEvent,
  onSubmitProposal,
  onCloseRegistration,
  onOpenRegistration
}) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">You don't have any events yet.</p>
        <p className="text-gray-400 mt-2">Create event proposals to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map(event => (
        <div key={event._id} className="border rounded-lg p-6 bg-gray-50 hover:bg-white transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 hover:text-primary-600 cursor-pointer">
                {event.title}
              </h3>
              <p className="text-gray-600 mt-1 line-clamp-2">{event.description}</p>
              
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {new Date(event.date).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {event.location}
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  {event.currentAttendees || 0}/{event.maxAttendees} registered • {event.availableSlots || event.maxAttendees} available
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  event.status === 'approved' ? 'bg-green-100 text-green-800' :
                  event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  event.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {event.status}
                </span>
                
                {/* ✅ NEW: Registration Status Badge */}
                {event.status === 'approved' && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    event.registrationClosed 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {event.registrationClosed ? 'Registration Closed' : 'Registration Open'}
                  </span>
                )}
              </div>

              {/* ✅ NEW: Show closed at timestamp */}
              {event.status === 'approved' && event.registrationClosed && event.closedAt && (
                <div className="mt-2 text-xs text-gray-500 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Registration closed on {new Date(event.closedAt).toLocaleDateString()}
                </div>
              )}

              {/* ✅ NEW: Show rejection notes for rejected events */}
              {event.status === 'rejected' && event.approvalNotes && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="font-medium text-red-800">Rejection Reason:</p>
                      <p className="text-red-700 text-sm mt-1">{event.approvalNotes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Event Banner Preview */}
            {event.bannerImage && (
              <div className="ml-4">
                <img 
                  src={`${getImageUrl(event.bannerImage)}?t=${Date.now()}`} // ✅ FIXED: Using imported function
                  alt="Event banner"
                  className="w-32 h-20 object-cover rounded"
                  onError={(e) => {
                    console.error(`Banner failed to load: ${event.bannerImage}`);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Event Management Actions */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              to={`/events/${event._id}`}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-md hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </Link>
            
            {/* ✅ NEW: Submit for Approval button (for draft events) */}
            {event.status === 'draft' && (
              <button
                onClick={() => onSubmitProposal(event._id, event.title)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit for Approval
              </button>
            )}
            
            {event.status === 'approved' && (
              <>
                {/* ✅ NEW: Registration Control Buttons */}
                {event.registrationClosed ? (
                  <button
                    onClick={() => onOpenRegistration(event._id, event.title)}
                    className="px-4 py-2 bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 text-white rounded-md hover:shadow-lg hover:shadow-green-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center"
                    title="Re-open registration for this event"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Open Registration
                  </button>
                ) : (
                  <button
                    onClick={() => onCloseRegistration(event._id, event.title)}
                    className="px-4 py-2 bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white rounded-md hover:shadow-lg hover:shadow-red-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center"
                    title="Close registration to prevent new sign-ups"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Close Registration
                  </button>
                )}

                <button
                  onClick={() => onGenerateShareLink(event._id)}
                  className="px-4 py-2 bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 text-white rounded-md hover:shadow-lg hover:shadow-green-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Event
                </button>

                <button
                  onClick={() => onUploadClick(event._id, 'banner')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-md hover:shadow-lg hover:shadow-purple-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Banner
                </button>

                <button
                  onClick={() => onUploadClick(event._id, 'images')}
                  className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-md hover:shadow-lg hover:shadow-orange-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Images
                </button>

                {/* ✅ NEW: Delete button for approved events */}
                <button
                  onClick={() => onDeleteEvent(event._id, event.title)}
                  className="px-4 py-2 bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white rounded-md hover:shadow-lg hover:shadow-red-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Event
                </button>
              </>
            )}

            {/* ✅ FIXED: Delete button for draft, pending, AND rejected events - ORGANIZER PERMISSIONS */}
            {(event.status === 'draft' || event.status === 'pending' || event.status === 'rejected') && (
              <button
                onClick={() => onDeleteProposal(event._id, event.title, event.status)}
                className="px-4 py-2 bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white rounded-md hover:shadow-lg hover:shadow-red-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete {event.status === 'draft' ? 'Draft' : event.status === 'pending' ? 'Pending' : 'Rejected'}
              </button>
            )}

            {/* Pending events can also upload media */}
            {event.status === 'pending' && (
              <>
                <button
                  onClick={() => onUploadClick(event._id, 'banner')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-md hover:shadow-lg hover:shadow-purple-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Banner
                </button>

                <button
                  onClick={() => onUploadClick(event._id, 'images')}
                  className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-md hover:shadow-lg hover:shadow-orange-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Images
                </button>
              </>
            )}
          </div>

          {/* Event Media Preview */}
          {(event.bannerImage || event.images?.length > 0 || event.videos?.length > 0) && (
            <MediaGallery 
              event={event} 
              onMediaUpdated={onMediaUpdated}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ✅ UPDATED: Attendance Tab Component - CLEAN DISPLAY ONLY (No Actions)
const AttendanceTab = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const loadAttendance = async (eventId) => {
    if (!eventId) return;
    
    setLoadingAttendance(true);
    try {
      const result = await eventsService.getAttendanceList(eventId);
      if (result.success) {
        setAttendanceData(result.data);
      } else {
        toast.error(result.message || 'Failed to load attendance list');
      }
    } catch (error) {
      toast.error('Failed to load attendance list');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleEventSelect = (eventId) => {
    setSelectedEvent(eventId);
    loadAttendance(eventId);
  };

  const handlePrintAttendance = () => {
    if (!attendanceData) return;
    
    const printWindow = window.open('', '_blank');
    const { event, attendance, summary } = attendanceData;
    
    const eventDate = new Date(event.date).toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Sheet - ${event.title}</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 40px; 
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 { 
            margin: 0; 
            color: #2c3e50; 
            font-size: 24px;
          }
          .header .subtitle { 
            color: #7f8c8d; 
            margin: 5px 0 20px 0;
            font-size: 14px;
          }
          .university-title {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          .event-info { 
            margin: 25px 0; 
            padding: 20px; 
            background: #f8f9fa; 
            border-radius: 8px;
            border-left: 4px solid #3498db;
          }
          .event-info h3 { 
            margin-top: 0; 
            color: #2c3e50;
          }
          .summary { 
            display: flex; 
            justify-content: space-between; 
            margin: 25px 0; 
            flex-wrap: wrap;
          }
          .summary-box { 
            flex: 1; 
            text-align: center; 
            padding: 15px; 
            background: #e8f4fd; 
            margin: 0 5px 10px 5px; 
            border-radius: 6px;
            min-width: 150px;
          }
          .summary-box h3 { 
            margin: 0; 
            font-size: 24px; 
            color: #2980b9;
          }
          .summary-box p { 
            margin: 5px 0 0 0; 
            color: #2c3e50;
            font-weight: bold;
          }
          .attendance-section { 
            margin: 35px 0; 
            page-break-inside: avoid;
          }
          .gender-header { 
            background: #2c3e50; 
            color: white; 
            padding: 12px 15px; 
            margin: 20px 0 15px 0; 
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
          }
          .attendance-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
            font-size: 14px;
          }
          .attendance-table th { 
            background: #3498db; 
            color: white; 
            padding: 12px 10px; 
            text-align: left; 
            border: 1px solid #ddd;
          }
          .attendance-table td { 
            padding: 12px 10px; 
            border-bottom: 1px solid #ddd;
            border-left: 1px solid #ddd;
            border-right: 1px solid #ddd;
          }
          .attendance-table tr:nth-child(even) { 
            background: #f9f9f9; 
          }
          .attendance-table tr:hover { 
            background: #f1f8ff; 
          }
          .signature-col { 
            width: 200px; 
            text-align: center; 
            font-style: italic;
            color: #7f8c8d;
          }
          .signature-line { 
            height: 1px; 
            background: #333; 
            margin: 25px auto 5px auto; 
            width: 150px;
          }
          .no-data { 
            text-align: center; 
            padding: 40px; 
            color: #95a5a6; 
            font-style: italic;
            font-size: 16px;
          }
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            font-style: italic; 
            color: #7f8c8d;
            font-size: 12px;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          @media print {
            body { 
              margin: 20px; 
              font-size: 12px;
            }
            .no-print { 
              display: none; 
            }
            .summary-box { 
              page-break-inside: avoid;
            }
            .attendance-section {
              page-break-inside: avoid;
            }
            .attendance-table {
              page-break-inside: avoid;
            }
          }
          .page-break {
            page-break-before: always;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="university-title">BICOL UNIVERSITY POLANGUI</div>
          <div class="subtitle">University Event Management System</div>
          <h2>OFFICIAL ATTENDANCE SHEET</h2>
          ${event.registrationClosed ? '<div style="background: #f8d7da; color: #721c24; padding: 10px; margin: 10px 0; border: 1px solid #f5c6cb; border-radius: 4px; font-weight: bold;">⚠️ REGISTRATION CLOSED - NO NEW SIGN-UPS ACCEPTED</div>' : ''}
        </div>
        
        <div class="event-info">
          <h3>${event.title}</h3>
          <p><strong>📅 Date:</strong> ${eventDate}</p>
          <p><strong>📍 Location:</strong> ${event.location}</p>
          <p><strong>📋 Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          <p><strong>👤 Organizer Copy:</strong> For physical signature collection during the event</p>
          ${event.registrationClosed ? '<p style="color: #d9534f;"><strong>🔒 Registration Status:</strong> CLOSED - No new registrations accepted</p>' : ''}
        </div>
        
        <div class="summary">
          <div class="summary-box">
            <h3>${summary.total}</h3>
            <p>TOTAL REGISTERED</p>
          </div>
          <div class="summary-box">
            <h3>${summary.male}</h3>
            <p>MALE</p>
          </div>
          <div class="summary-box">
            <h3>${summary.female}</h3>
            <p>FEMALE</p>
          </div>
          <div class="summary-box">
            <h3>${summary.other + summary.preferNotToSay}</h3>
            <p>OTHER/NOT SPECIFIED</p>
          </div>
        </div>
        
        ${Object.entries(attendance).map(([gender, attendees]) => {
          if (attendees.length === 0) return '';
          
          const genderTitle = gender === 'male' ? 'MALE ATTENDEES' :
                            gender === 'female' ? 'FEMALE ATTENDEES' :
                            gender === 'other' ? 'OTHER GENDER' : 
                            'PREFER NOT TO SAY';
          
          return `
            <div class="attendance-section">
              <div class="gender-header">${genderTitle} (${attendees.length})</div>
              <table class="attendance-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>STUDENT ID</th>
                    <th>LAST NAME</th>
                    <th>FIRST NAME</th>
                    <th>EMAIL</th>
                    <th class="signature-col">SIGNATURE</th>
                  </tr>
                </thead>
                <tbody>
                  ${attendees.map((attendee, index) => `
                    <tr>
                      <td style="font-weight: bold;">${index + 1}</td>
                      <td style="font-family: monospace;">${attendee.studentId}</td>
                      <td>${attendee.lastName}</td>
                      <td>${attendee.firstName}</td>
                      <td style="font-size: 12px; color: #555;">${attendee.email}</td>
                      <td class="signature-col">
                        <div class="signature-line"></div>
                        <div style="font-size: 11px; margin-top: 3px;">Sign here</div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }).join('')}
        
        ${summary.total === 0 ? `
          <div class="no-data">
            <h3>No attendees registered for this event yet</h3>
            <p>Share the event link to get registrations!</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <p><strong>OFFICIAL DOCUMENT</strong> - Bicol University Polangui Event Management System</p>
          <p>Generated automatically on ${new Date().toLocaleString()}</p>
          <p style="margin-top: 10px; color: #e74c3c; font-weight: bold;">
            ⚠️ IMPORTANT: Present this sheet physically during the event for signature collection
          </p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => {
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Get only approved events
  const approvedEvents = events.filter(e => e.status === 'approved');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Management</h3>
        <p className="text-gray-600 mb-6">
          View registered attendees organized by gender and alphabetically. Generate printable attendance sheets for physical signature collection during events.
          <span className="block mt-2 text-sm text-red-600">
            💡 <strong>Tip:</strong> Close registration before printing attendance sheets to prevent new sign-ups from complicating your records.
          </span>
        </p>
        
        {/* Event Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Event to View Attendance
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedEvents.map(event => (
              <div
                key={event._id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedEvent === event._id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
                onClick={() => handleEventSelect(event._id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{event.location}</p>
                    
                    {/* ✅ NEW: Registration Status Badge */}
                    {event.registrationClosed && (
                      <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full mt-1">
                        🔒 Registration Closed
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      event.registrationClosed 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {event.currentAttendees || 0} registered
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {approvedEvents.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-3">📋</div>
              <p className="text-gray-500">No approved events available</p>
              <p className="text-gray-400 text-sm mt-1">Approved events will appear here for attendance viewing</p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loadingAttendance && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 mt-2">Loading attendance data...</p>
          </div>
        )}

        {/* Attendance Data Display - SIMPLIFIED (No Actions) */}
        {!loadingAttendance && attendanceData && (
          <div className="bg-white border rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{attendanceData.event.title}</h4>
                <p className="text-gray-600">
                  {new Date(attendanceData.event.date).toLocaleDateString()} • {attendanceData.event.location}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Total Registered: {attendanceData.summary.total} attendees
                  {attendanceData.event.registrationClosed && (
                    <span className="ml-2 text-red-600 font-medium">• Registration Closed</span>
                  )}
                </p>
              </div>
              <div className="flex space-x-2">
                {!attendanceData.event.registrationClosed && (
                  <button
                    onClick={() => {
                      // This would trigger the close registration function
                      if (window.confirm(`Close registration for "${attendanceData.event.title}" before printing?\n\nThis prevents new registrations from complicating your printed attendance list.`)) {
                        // This is just a suggestion - actual implementation would be in the parent component
                        alert('Go back to Events tab to close registration before printing');
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Close Registration First
                  </button>
                )}
                <button
                  onClick={handlePrintAttendance}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Attendance Sheet
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{attendanceData.summary.total}</div>
                <div className="text-sm text-blue-800 font-medium">Total Registered</div>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-700">{attendanceData.summary.male}</div>
                <div className="text-sm text-blue-900 font-medium">Male</div>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-pink-600">{attendanceData.summary.female}</div>
                <div className="text-sm text-pink-800 font-medium">Female</div>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-gray-600">
                  {attendanceData.summary.other + attendanceData.summary.preferNotToSay}
                </div>
                <div className="text-sm text-gray-800 font-medium">Other/Not Specified</div>
              </div>
            </div>

            {/* Gender Sections - SIMPLIFIED (Display Only) */}
            {Object.entries(attendanceData.attendance).map(([gender, attendees]) => {
              if (attendees.length === 0) return null;
              
              const genderTitle = gender === 'male' ? 'Male Attendees' :
                                gender === 'female' ? 'Female Attendees' :
                                gender === 'other' ? 'Other Gender' :
                                'Prefer Not to Say';
              
              const genderColor = gender === 'male' ? 'blue' :
                                gender === 'female' ? 'pink' :
                                'gray';
              
              return (
                <div key={gender} className="mb-8">
                  <div className={`flex items-center justify-between mb-4 p-3 bg-${genderColor}-50 border border-${genderColor}-200 rounded-lg`}>
                    <div className="flex items-center">
                      <span className={`inline-block w-3 h-3 rounded-full bg-${genderColor}-500 mr-2`}></span>
                      <h5 className="font-semibold text-gray-900">{genderTitle}</h5>
                    </div>
                    <span className={`px-3 py-1 bg-${genderColor}-100 text-${genderColor}-800 text-sm rounded-full font-medium`}>
                      {attendees.length} {attendees.length === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gender
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendees.map((attendee, index) => (
                          <tr key={attendee._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {attendee.studentId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {attendee.lastName}, {attendee.firstName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {attendee.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                attendee.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                                attendee.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {attendee.gender === 'male' ? 'Male' : 
                                 attendee.gender === 'female' ? 'Female' : 
                                 attendee.gender === 'other' ? 'Other' : 'Prefer not to say'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {attendanceData.summary.total === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h5 className="text-lg font-medium text-gray-900 mb-2">No Attendees Registered Yet</h5>
                <p className="text-gray-600">No one has registered for this event yet.</p>
                <p className="text-gray-400 text-sm mt-1">Share the event link to get registrations!</p>
              </div>
            )}

            {/* Print Instructions */}
            {attendanceData.summary.total > 0 && (
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-yellow-800">Print Instructions:</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      {attendanceData.event.registrationClosed 
                        ? '✅ Registration is closed. You can safely print the attendance sheet without new registrations complicating your records.'
                        : '⚠️ Consider closing registration before printing to prevent new sign-ups from complicating your printed attendance list.'}
                    </p>
                    <p className="text-yellow-700 text-sm mt-2">
                      Click "Print Attendance Sheet" to generate a printable list with signature spaces. 
                      Present the printed sheet physically during the event for attendees to sign.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Event Selected State */}
        {!loadingAttendance && !attendanceData && selectedEvent && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h5 className="text-lg font-medium text-gray-900 mb-2">Loading Attendance Data</h5>
            <p className="text-gray-600">Loading registered attendees for the selected event...</p>
          </div>
        )}

        {/* No Event Selected */}
        {!selectedEvent && approvedEvents.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h5 className="text-lg font-medium text-gray-900 mb-2">Select an Event</h5>
            <p className="text-gray-600">Choose an approved event from the list above to view registered attendees.</p>
            <p className="text-gray-400 text-sm mt-2">
              💡 <strong>Best Practice:</strong> Close registration for an event before printing attendance sheets to prevent new registrations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Analytics Tab - ENHANCED WITH MEANINGFUL INSIGHTS
const AnalyticsTab = ({ events }) => {
  const approvedEvents = events.filter(e => e.status === 'approved');
  const pendingEvents = events.filter(e => e.status === 'pending');
  const draftEvents = events.filter(e => e.status === 'draft');
  const rejectedEvents = events.filter(e => e.status === 'rejected');

  // Calculate meaningful metrics
  const totalRegistrations = approvedEvents.reduce((acc, event) => acc + (event.currentAttendees || 0), 0);
  const totalCapacity = approvedEvents.reduce((acc, event) => acc + (event.maxAttendees || 0), 0);
  const avgFillRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;
  
  // Media stats
  const totalImages = events.reduce((acc, event) => acc + (event.images?.length || 0), 0);
  const totalVideos = events.reduce((acc, event) => acc + (event.videos?.length || 0), 0);
  const eventsWithBanner = events.filter(e => e.bannerImage).length;
  
  // Event performance analysis
  const highPerformanceEvents = approvedEvents.filter(event => {
    const fillRate = event.maxAttendees > 0 ? 
      Math.round(((event.currentAttendees || 0) / event.maxAttendees) * 100) : 0;
    return fillRate >= 70;
  });
  
  const lowPerformanceEvents = approvedEvents.filter(event => {
    const fillRate = event.maxAttendees > 0 ? 
      Math.round(((event.currentAttendees || 0) / event.maxAttendees) * 100) : 0;
    return fillRate < 30;
  });

  // ✅ NEW: Registration status stats
  const closedRegistrationEvents = approvedEvents.filter(e => e.registrationClosed).length;
  const openRegistrationEvents = approvedEvents.filter(e => !e.registrationClosed).length;

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-5xl mb-4">📊</div>
        <p className="text-gray-500 text-lg">No analytics data available yet.</p>
        <p className="text-gray-400 text-sm mt-2">Create and publish events to see analytics</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Event Analytics Dashboard</h3>
        <p className="text-gray-600 text-sm mt-1">Track your event performance and engagement</p>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Event Status</p>
              <div className="flex items-center mt-1">
                <span className="text-xl font-bold text-gray-900">{events.length}</span>
                <span className="text-green-600 text-sm ml-2">total</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {approvedEvents.length} live
              </span>
              <div className="text-xs text-gray-500 mt-1">
                {closedRegistrationEvents} closed • {openRegistrationEvents} open
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Registration Rate</p>
              <div className="flex items-center mt-1">
                <span className="text-xl font-bold text-gray-900">{avgFillRate}%</span>
                <span className="text-blue-600 text-sm ml-2">filled</span>
              </div>
            </div>
            <div className="text-right">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {totalRegistrations}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">registrations</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Media Content</p>
              <div className="flex items-center mt-1">
                <span className="text-xl font-bold text-gray-900">{totalImages + totalVideos}</span>
                <span className="text-purple-600 text-sm ml-2">files</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex space-x-1">
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  {totalImages} images
                </span>
                <span className="inline-block px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded">
                  {totalVideos} videos
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {eventsWithBanner} banners
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Event Health</p>
              <div className="flex items-center mt-1">
                <span className="text-xl font-bold text-gray-900">{highPerformanceEvents.length}</span>
                <span className="text-green-600 text-sm ml-2">high</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ 
                      width: `${approvedEvents.length > 0 ? 
                        (highPerformanceEvents.length / approvedEvents.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">
                  {approvedEvents.length > 0 ? 
                    Math.round((highPerformanceEvents.length / approvedEvents.length) * 100) : 0}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {lowPerformanceEvents.length} need attention
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Performing Events */}
        <div className="bg-white rounded-lg shadow border p-4">
          <h4 className="font-semibold text-gray-800 mb-3">🏆 Top Performing Events</h4>
          {highPerformanceEvents.length > 0 ? (
            <div className="space-y-3">
              {highPerformanceEvents.slice(0, 3).map(event => {
                const fillRate = event.maxAttendees > 0 ? 
                  Math.round(((event.currentAttendees || 0) / event.maxAttendees) * 100) : 0;
                return (
                  <div key={event._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.date).toLocaleDateString()}
                        {event.registrationClosed && (
                          <span className="ml-2 text-red-600">• Registration Closed</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min(fillRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-green-600">{fillRate}%</span>
                    </div>
                  </div>
                );
              })}
              {highPerformanceEvents.length > 3 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  +{highPerformanceEvents.length - 3} more high-performing events
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No high-performing events yet</p>
              <p className="text-gray-400 text-xs mt-1">Events with ≥70% fill rate appear here</p>
            </div>
          )}
        </div>

        {/* Events Needing Attention */}
        <div className="bg-white rounded-lg shadow border p-4">
          <h4 className="font-semibold text-gray-800 mb-3">⚠️ Events Needing Attention</h4>
          {lowPerformanceEvents.length > 0 ? (
            <div className="space-y-3">
              {lowPerformanceEvents.slice(0, 3).map(event => {
                const fillRate = event.maxAttendees > 0 ? 
                  Math.round(((event.currentAttendees || 0) / event.maxAttendees) * 100) : 0;
                return (
                  <div key={event._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {event.currentAttendees || 0}/{event.maxAttendees} registered
                        {event.registrationClosed && (
                          <span className="ml-2 text-red-600">• Registration Closed</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${Math.min(fillRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-yellow-600">{fillRate}%</span>
                    </div>
                  </div>
                );
              })}
              {lowPerformanceEvents.length > 3 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  +{lowPerformanceEvents.length - 3} more events need attention
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">All events are performing well!</p>
              <p className="text-gray-400 text-xs mt-1">Events with 30% fill rate appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Event Analytics */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h4 className="font-semibold text-gray-800">📈 Detailed Event Analytics</h4>
          <p className="text-gray-600 text-sm mt-1">Click on events to view details and take action</p>
        </div>
        
        <div className="p-4">
          {approvedEvents.length > 0 ? (
            <div className="space-y-4">
              {approvedEvents.map(event => {
                const fillRate = event.maxAttendees > 0 ? 
                  Math.round(((event.currentAttendees || 0) / event.maxAttendees) * 100) : 0;
                const daysUntilEvent = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={event._id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-semibold text-gray-900 truncate">{event.title}</h5>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            fillRate >= 70 ? 'bg-green-100 text-green-800' :
                            fillRate >= 30 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {fillRate >= 70 ? 'High' : fillRate >= 30 ? 'Medium' : 'Low'}
                          </span>
                          {event.registrationClosed && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              🔒 Closed
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className="mr-2">📅</span>
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                            {daysUntilEvent > 0 && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({daysUntilEvent} days)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">👥</span>
                            <span>{event.currentAttendees || 0}/{event.maxAttendees}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">🖼️</span>
                            <span>{event.images?.length || 0} images</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">📍</span>
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{fillRate}%</div>
                          <div className="text-xs text-gray-500">Fill Rate</div>
                        </div>
                        <Link
                          to={`/events/${event._id}`}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors text-xs"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Event Capacity Progress</span>
                        <span>{event.currentAttendees || 0} of {event.maxAttendees} slots filled</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            fillRate >= 70 ? 'bg-green-500' :
                            fillRate >= 30 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(fillRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-3">📊</div>
              <p className="text-gray-500">No approved events to analyze</p>
              <p className="text-gray-400 text-sm mt-1">Once your events are approved, analytics will appear here</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Footer */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h5 className="font-medium text-gray-900">Analytics Summary</h5>
            <p className="text-sm text-gray-600">
              You have {approvedEvents.length} live events ({closedRegistrationEvents} with closed registration, {openRegistrationEvents} open) with an average fill rate of {avgFillRate}%
            </p>
          </div>
          <div className="mt-3 md:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{highPerformanceEvents.length}</div>
              <div className="text-xs text-gray-600">High Perf.</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">
                {approvedEvents.length - highPerformanceEvents.length - lowPerformanceEvents.length}
              </div>
              <div className="text-xs text-gray-600">Average</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{lowPerformanceEvents.length}</div>
              <div className="text-xs text-gray-600">Need Attention</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Media Library Tab - FIXED SYNTAX ERROR
const MediaLibraryTab = ({ events, onDeleteProposal, onDeleteEvent }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  
  const allMedia = [];
  
  events.forEach(event => {
    if (event.bannerImage) {
      allMedia.push({
        eventId: event._id,
        eventTitle: event.title,
        eventStatus: event.status,
        registrationClosed: event.registrationClosed,
        type: 'banner',
        url: event.bannerImage,
        filename: event.bannerImage.split('/').pop()
      });
    }
    
    if (event.images) {
      event.images.forEach(image => {
        allMedia.push({
          eventId: event._id,
          eventTitle: event.title,
          eventStatus: event.status,
          registrationClosed: event.registrationClosed,
          type: 'image',
          url: image.url,
          filename: image.url.split('/').pop(),
          caption: image.caption
        });
      });
    }
    
    if (event.videos) {
      event.videos.forEach(video => {
        allMedia.push({
          eventId: event._id,
          eventTitle: event.title,
          eventStatus: event.status,
          registrationClosed: event.registrationClosed,
          type: 'video',
          url: video.url,
          filename: video.url.split('/').pop(),
          title: video.title
        });
      });
    }
  });

  const openLightbox = (media) => {
    setLightboxMedia(media);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxMedia(null);
  };

  const handleDeleteMedia = (eventId, eventTitle, eventStatus) => {
    if (eventStatus === 'approved') {
      // For approved events, use the new deleteEvent function
      if (onDeleteEvent) {
        onDeleteEvent(eventId, eventTitle);
      }
    } else {
      // For draft/pending/rejected, use the existing function
      if (onDeleteProposal) {
        onDeleteProposal(eventId, eventTitle, eventStatus);
      }
    }
  };

  if (allMedia.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No media uploaded yet.</p>
        <p className="text-gray-400 mt-2">Upload media from the Events tab to see them here.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Media Library</h3>
        <span className="text-sm text-gray-600">{allMedia.length} files</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allMedia.map((media, index) => (
          <div key={index} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
            {media.type === 'image' || media.type === 'banner' ? (
              <div 
                className="h-48 overflow-hidden cursor-pointer"
                onClick={() => openLightbox(media)}
              >
                <img 
                  src={`${getImageUrl(media.url)}?t=${Date.now()}`} // ✅ FIXED: Using imported function
                  alt={media.caption || media.filename}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    console.error(`Media failed to load: ${media.url}`);
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    parent.innerHTML = `
                      <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                        <div class="text-center">
                          <span class="text-gray-500">Failed to load</span>
                          <p class="text-gray-400 text-xs">${media.filename}</p>
                        </div>
                      </div>
                    `;
                  }}
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-white text-4xl mb-2 block">🎬</span>
                  <p className="text-white font-medium">{media.title || media.filename}</p>
                  <p className="text-gray-400 text-sm mt-1">Video</p>
                </div>
              </div>
            )}
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 truncate">{media.eventTitle}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  media.type === 'banner' ? 'bg-purple-100 text-purple-800' :
                  media.type === 'image' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {media.type}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <div className="flex space-x-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    media.eventStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    media.eventStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    media.eventStatus === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {media.eventStatus}
                  </span>
                  
                  {/* ✅ NEW: Registration Status Badge */}
                  {media.eventStatus === 'approved' && media.registrationClosed && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      🔒 Closed
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <a 
                    href={`/events/${media.eventId}`}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    View Event →
                  </a>
                  
                  {/* Delete button for all event statuses */}
                  <button
                    onClick={() => handleDeleteMedia(media.eventId, media.eventTitle, media.eventStatus)}
                    className="text-sm text-red-600 hover:text-red-800 ml-2"
                    title={`Delete ${media.eventStatus} event`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && lightboxMedia && (lightboxMedia.type === 'image' || lightboxMedia.type === 'banner') && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white text-3xl z-10 hover:text-gray-300"
            >
              ✕
            </button>
            
            {/* Media display */}
            <div className="flex items-center justify-center h-full">
              <img
                src={`${getImageUrl(lightboxMedia.url)}?t=${Date.now()}`} // ✅ FIXED: Using imported function
                alt={lightboxMedia.caption || lightboxMedia.filename}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
            
            {/* Caption and info */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <div className="inline-block bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                <p className="text-white font-medium">{lightboxMedia.eventTitle}</p>
                {lightboxMedia.caption && (
                  <p className="text-gray-300 text-sm mt-1">{lightboxMedia.caption}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;