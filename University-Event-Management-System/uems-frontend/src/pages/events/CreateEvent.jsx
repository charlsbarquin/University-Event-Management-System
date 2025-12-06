import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsService } from '../../services/events';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Sparkles, Calendar, MapPin, Tag, FileText, Users, Zap } from 'lucide-react';

const CreateEvent = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    location: '',
    maxAttendees: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = ['academic', 'cultural', 'sports', 'workshop', 'seminar', 'social', 'other'];

  // ✅ FIXED: REMOVED the active event check since organizers can create unlimited events

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await eventsService.createProposal(formData);
      
      if (result.success) {
        toast.success('Event proposal created as draft!');
        navigate('/dashboard');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create event proposal');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-[#0A2FF1]" />
              <span className="text-sm font-semibold text-[#0A2FF1] bg-blue-100 px-3 py-1 rounded-full">
                Create Your Event
              </span>
              <Sparkles className="w-6 h-6 text-[#0A2FF1]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
              Organize Something Amazing
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Share your ideas with the campus community. Create an event proposal and get started today
            </p>
          </div>

          {/* Organizer Info Banner */}
          {user?.role === 'organizer' && (
            <div className="mb-8 bg-white/80 backdrop-blur-xl rounded-2xl border-l-4 border-[#0A2FF1] shadow-lg p-4 lg:p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Zap className="w-5 h-5 text-[#0A2FF1] mt-0.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Pro Tip: Unlimited Event Creation
                  </p>
                  <p className="text-sm text-gray-600">
                    As an organizer, you can create unlimited event proposals. All events require admin approval before becoming public.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0A2FF1]" />
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-300 text-sm font-medium bg-gray-50/50 hover:border-gray-300 focus:border-[#0A2FF1] focus:bg-blue-50/50 focus:shadow-lg focus:shadow-blue-200/50 placeholder-gray-400"
                  placeholder="e.g., Tech Workshop 2025"
                />
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0A2FF1]" />
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-300 text-sm font-medium bg-gray-50/50 hover:border-gray-300 focus:border-[#0A2FF1] focus:bg-blue-50/50 focus:shadow-lg focus:shadow-blue-200/50 placeholder-gray-400 resize-none"
                  placeholder="Describe your event, what it's about, what attendees will learn or experience..."
                />
              </div>

              {/* Two Column Row 1: Category & Max Attendees */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#0A2FF1]" />
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-300 text-sm font-medium appearance-none bg-gray-50/50 hover:border-gray-300 focus:border-[#0A2FF1] focus:bg-blue-50/50 focus:shadow-lg focus:shadow-blue-200/50"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0A2FF1]" />
                    Max Attendees <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="maxAttendees"
                    required
                    min="1"
                    value={formData.maxAttendees}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-300 text-sm font-medium bg-gray-50/50 hover:border-gray-300 focus:border-[#0A2FF1] focus:bg-blue-50/50 focus:shadow-lg focus:shadow-blue-200/50 placeholder-gray-400"
                    placeholder="e.g., 50"
                  />
                </div>
              </div>

              {/* Two Column Row 2: Date & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0A2FF1]" />
                    Event Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-300 text-sm font-medium bg-gray-50/50 hover:border-gray-300 focus:border-[#0A2FF1] focus:bg-blue-50/50 focus:shadow-lg focus:shadow-blue-200/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0A2FF1]" />
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-300 text-sm font-medium bg-gray-50/50 hover:border-gray-300 focus:border-[#0A2FF1] focus:bg-blue-50/50 focus:shadow-lg focus:shadow-blue-200/50 placeholder-gray-400"
                    placeholder="e.g., Room 101, Main Hall"
                  />
                </div>
              </div>

              {/* Tags Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0A2FF1]" />
                  Tags (optional)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-300 text-sm font-medium bg-gray-50/50 hover:border-gray-300 focus:border-[#0A2FF1] focus:bg-blue-50/50 focus:shadow-lg focus:shadow-blue-200/50 placeholder-gray-400"
                  placeholder="technology, workshop, coding, etc. (separate with commas)"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2.5 text-sm font-semibold text-[#0A2FF1] hover:text-[#0818A8] hover:bg-blue-50 rounded-lg transition-all duration-200"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0A2FF1] to-[#0818A8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-300 text-sm font-semibold hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Draft
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
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

export default CreateEvent;