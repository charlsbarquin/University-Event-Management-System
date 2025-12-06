import React, { useState, useEffect } from 'react';
import { eventsService } from '../../services/events';
import { notificationsService } from '../../services/notification';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, FileText, Bell, Plus, Clock, CheckCircle, X, Eye, Trash2, Send, ChevronRight, Sparkles, Zap } from 'lucide-react';

const StudentDashboard = () => {
  const [myProposals, setMyProposals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('proposals');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [proposalsResult, notificationsResult] = await Promise.all([
        eventsService.getMyProposals(),
        notificationsService.getNotifications()
      ]);

      if (proposalsResult.success) {
        setMyProposals(proposalsResult.data.events);
      } else {
        toast.error(proposalsResult.message || 'Failed to load proposals');
      }
      
      if (notificationsResult.success) {
        setNotifications(notificationsResult.data.notifications);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProposal = async (proposalId, proposalTitle, status) => {
    let confirmMessage = '';
    
    if (status === 'draft') {
      confirmMessage = `Are you sure you want to delete the draft "${proposalTitle}"? This cannot be undone.`;
    } else if (status === 'pending') {
      confirmMessage = `Are you sure you want to delete the pending event "${proposalTitle}"? This cannot be undone.`;
    } else if (status === 'rejected') {
      confirmMessage = `Are you sure you want to delete the rejected event "${proposalTitle}"? This cannot be undone.`;
    }
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await eventsService.deleteProposal(proposalId);
      if (result.success) {
        toast.success(`${status === 'draft' ? 'Draft' : status === 'pending' ? 'Pending event' : 'Rejected event'} deleted successfully`);
        setMyProposals(prev => prev.filter(p => p._id !== proposalId));
      } else {
        toast.error(result.message || `Failed to delete ${status === 'draft' ? 'draft' : 'event'}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to delete ${status === 'draft' ? 'draft' : 'event'}`);
    }
  };

  const handleSubmitProposal = async (eventId, eventTitle) => {
    if (!window.confirm(`Submit "${eventTitle}" for admin approval?`)) {
      return;
    }

    try {
      const result = await eventsService.submitProposal(eventId);
      if (result.success) {
        toast.success('Event submitted for approval!');
        setMyProposals(prev => 
          prev.map(p => 
            p._id === eventId ? { ...p, status: 'pending' } : p
          )
        );
      } else {
        toast.error(result.message || 'Failed to submit proposal');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit proposal');
    }
  };

  const handleCancelSubmission = async (eventId, eventTitle) => {
    if (!window.confirm(`Cancel submission of "${eventTitle}"? This will return it to draft status.`)) {
      return;
    }

    try {
      const result = await eventsService.cancelSubmission(eventId);
      if (result.success) {
        toast.success('Submission cancelled - event returned to draft');
        setMyProposals(prev => 
          prev.map(p => 
            p._id === eventId ? { ...p, status: 'draft' } : p
          )
        );
      } else {
        toast.error(result.message || 'Failed to cancel submission');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel submission');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-[#0A2FF1] rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
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
                Student Dashboard
              </span>
              <Sparkles className="w-6 h-6 text-[#0A2FF1]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight leading-tight">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Manage your event proposals and stay updated with notifications
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Proposals Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-7 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0A2FF1] to-[#0818A8] rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">{myProposals.length}</p>
                </div>
              </div>
            </div>

            {/* Pending Approval Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-7 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-400 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {myProposals.filter(p => p.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-7 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
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
                  onClick={() => setActiveTab('proposals')}
                  className={`flex-1 py-5 px-6 text-center font-medium text-sm transition-all duration-500 relative ${
                    activeTab === 'proposals'
                      ? 'text-[#0A2FF1] bg-gradient-to-b from-blue-50/50 to-transparent'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5" />
                    My Event Proposals
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {myProposals.length}
                    </span>
                  </div>
                  {activeTab === 'proposals' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0A2FF1] to-[#0818A8]"></div>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex-1 py-5 px-6 text-center font-medium text-sm transition-all duration-500 relative ${
                    activeTab === 'notifications'
                      ? 'text-[#0A2FF1] bg-gradient-to-b from-blue-50/50 to-transparent'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {notifications.length}
                    </span>
                  </div>
                  {activeTab === 'notifications' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0A2FF1] to-[#0818A8]"></div>
                  )}
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'proposals' && (
                <ProposalsTab
                  proposals={myProposals}
                  onSubmitProposal={handleSubmitProposal}
                  onDeleteProposal={handleDeleteProposal}
                  onCancelSubmission={handleCancelSubmission}
                />
              )}
              {activeTab === 'notifications' && (
                <NotificationsTab notifications={notifications} />
              )}
            </div>
          </div>
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

// Proposals Tab Component
const ProposalsTab = ({ proposals, onSubmitProposal, onDeleteProposal, onCancelSubmission }) => {
  if (proposals.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-4">
          <FileText className="w-8 h-8 text-[#0A2FF1]" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Event Proposals Yet</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Start by creating your first event proposal to share with the university community
        </p>
        <Link
          to="/events/create"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0A2FF1] via-[#1a4af8] to-[#0818A8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-500 font-semibold text-sm hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create Your First Event
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {proposals.map(proposal => (
        <div 
          key={proposal._id} 
          className="bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 p-6 hover:shadow-lg hover:border-blue-200/50 transition-all duration-300"
        >
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Event Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{proposal.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{proposal.description}</p>
                </div>
                
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                  proposal.status === 'approved' ? 'bg-green-500 text-white' :
                  proposal.status === 'pending' ? 'bg-yellow-500 text-white' :
                  proposal.status === 'draft' ? 'bg-gray-500 text-white' :
                  proposal.status === 'rejected' ? 'bg-red-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 hover:bg-blue-50/50 p-3 rounded-lg transition-colors duration-200">
                  <Calendar className="w-4 h-4 text-[#0A2FF1] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Date & Time</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(proposal.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 hover:bg-blue-50/50 p-3 rounded-lg transition-colors duration-200">
                  <MapPin className="w-4 h-4 text-[#0A2FF1] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Location</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{proposal.location}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 hover:bg-blue-50/50 p-3 rounded-lg transition-colors duration-200">
                  <Users className="w-4 h-4 text-[#0A2FF1] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Capacity</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {proposal.currentAttendees || 0}/{proposal.maxAttendees}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="lg:w-48 flex flex-col gap-3">
              {/* Draft events - Submit or Delete */}
              {proposal.status === 'draft' && (
                <>
                  <button
                    onClick={() => onSubmitProposal(proposal._id, proposal.title)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-[#0A2FF1] via-[#1a4af8] to-[#0818A8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit for Approval
                  </button>
                  <button
                    onClick={() => onDeleteProposal(proposal._id, proposal.title, 'draft')}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Draft
                  </button>
                </>
              )}
              
              {/* Pending events - Cancel Submission or Delete */}
              {proposal.status === 'pending' && (
                <>
                  <button
                    onClick={() => onCancelSubmission(proposal._id, proposal.title)}
                    className="w-full px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 hover:shadow-lg transition-all duration-300 text-sm font-semibold hover:scale-105 active:scale-95"
                  >
                    Cancel Submission
                  </button>
                  <button
                    onClick={() => onDeleteProposal(proposal._id, proposal.title, 'pending')}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
              
              {/* Rejected events - Delete */}
              {proposal.status === 'rejected' && (
                <button
                  onClick={() => onDeleteProposal(proposal._id, proposal.title, 'rejected')}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              
              {/* Approved events - View Event */}
              {proposal.status === 'approved' && (
                <Link
                  to={`/events/${proposal._id}`}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-400/40 transition-all duration-500 text-sm font-semibold hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Event
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Notifications Tab Component
const NotificationsTab = ({ notifications }) => {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
          <Bell className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications Yet</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          You'll see notifications here for event approvals, updates, and important announcements
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map(notification => (
        <div 
          key={notification._id} 
          className={`bg-white/50 backdrop-blur-sm rounded-xl border-l-4 ${
            notification.isRead ? 'border-gray-300' : 'border-[#0A2FF1]'
          } p-6 hover:shadow-lg transition-all duration-300`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                notification.type === 'event_approved' ? 'bg-green-100' :
                notification.type === 'event_rejected' ? 'bg-red-100' :
                notification.type === 'event_update' ? 'bg-blue-100' :
                'bg-purple-100'
              }`}>
                {notification.type === 'event_approved' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : notification.type === 'event_rejected' ? (
                  <X className="w-5 h-5 text-red-600" />
                ) : notification.type === 'event_update' ? (
                  <Zap className="w-5 h-5 text-blue-600" />
                ) : (
                  <Bell className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{notification.title}</h4>
                <p className="text-gray-600 text-sm">{notification.message}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              
              {!notification.isRead && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#0A2FF1] rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-[#0A2FF1]">New</span>
                </div>
              )}
            </div>
          </div>
          
          {notification.eventId && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <Link
                to={`/events/${notification.eventId}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A2FF1] hover:text-[#0818A8] transition-colors"
              >
                View Event Details
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StudentDashboard;