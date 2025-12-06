const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Analytics = require('../models/Analytics');

// @desc    Get all approved events (for browsing)
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res) => {
  try {
    const { category, page = 1, limit = 10, search } = req.query;
    
    const filter = { status: 'approved', isPublic: true };
    
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const events = await Event.find(filter)
      .populate('creator', 'firstName lastName studentId')
      .populate('organizer', 'firstName lastName studentId')
      .select('-approvalNotes -videos')
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Event.countDocuments(filter);

    if (events.length > 0) {
      const eventIds = events.map(event => event._id);
      
      const registrationCounts = await Registration.aggregate([
        {
          $match: {
            event: { $in: eventIds },
            status: { $in: ['registered', 'attended'] }
          }
        },
        {
          $group: {
            _id: '$event',
            count: { $sum: 1 }
          }
        }
      ]);

      const countMap = {};
      registrationCounts.forEach(rc => {
        countMap[rc._id.toString()] = rc.count;
      });

      events.forEach(event => {
        event.currentAttendees = countMap[event._id.toString()] || 0;
        event.availableSlots = event.maxAttendees - event.currentAttendees;
      });
    }

    res.json({
      success: true,
      data: {
        events,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEvents: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching events',
      error: error.message
    });
  }
};

// @desc    Get single event details
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'firstName lastName studentId profilePicture')
      .populate('organizer', 'firstName lastName studentId profilePicture')
      .populate('approvedBy', 'firstName lastName');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Simple protection: Only approved events are public
    if (event.status !== 'approved') {
      // If user is not authenticated
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Check if user is creator, organizer, or admin
      const isCreator = req.user._id.toString() === event.creator._id.toString();
      const isOrganizer = event.organizer && req.user._id.toString() === event.organizer._id.toString();
      const isAdmin = req.user.role === 'admin';
      
      if (!isCreator && !isOrganizer && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    let userRegistration = null;
    if (req.user) {
      // ✅ Fixed in previous step to reliably find registration status
     userRegistration = await Registration.findOne({
        user: req.user._id,
        event: event._id,
        $or: [
          { status: { $in: ['registered', 'attended', 'waitlisted'] } }, // Current active statuses
          { status: { $exists: false } } // Old records without a status field
        ]
      });
    }

    const attendeeCount = await Registration.countDocuments({
      event: event._id,
      status: { $in: ['registered', 'attended'] }
    });

    const eventObj = event.toObject();
    eventObj.currentAttendees = attendeeCount;
    eventObj.availableSlots = event.maxAttendees - attendeeCount;

    res.json({
      success: true,
      data: {
        event: eventObj,
        userRegistration
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching event',
      error: error.message
    });
  }
};

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
exports.registerForEvent = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const event = await Event.findById(req.params.id);
    
    if (!event || event.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Event not available for registration'
      });
    }

    // ✅ NEW: Check if registration is closed
    if (event.registrationClosed) {
      return res.status(400).json({
        success: false,
        message: 'Registration for this event is closed'
      });
    }

    // ✅ FIXED: Simple ObjectId query (Mongoose auto-converts)
    const existingRegistration = await Registration.findOne({
      user: req.user._id,
      event: event._id
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    // ✅ FIXED: Let Mongoose handle the type (will be ObjectId)
    const registration = await Registration.create({
      user: req.user._id,
      event: event._id,
      source: req.body.source || 'direct'
    });

    await Analytics.updateRegistrationStats(event._id, 'register');

    const attendeeCount = await Registration.countDocuments({
      event: event._id,
      status: { $in: ['registered', 'attended'] }
    });

    const updatedEvent = await Event.findById(event._id)
      .populate('creator', 'firstName lastName studentId')
      .populate('organizer', 'firstName lastName studentId')
      .lean();

    updatedEvent.currentAttendees = attendeeCount;
    updatedEvent.availableSlots = event.maxAttendees - attendeeCount;

    res.status(201).json({
      success: true,
      message: registration.status === 'waitlisted' 
        ? 'Added to waitlist - event is full' 
        : 'Successfully registered for event',
      data: { 
        registration,
        event: updatedEvent
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Unregister from event
// @route   DELETE /api/events/:id/register
// @access  Private
exports.unregisterFromEvent = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const event = await Event.findById(req.params.id);
    
    if (!event || event.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Event not available'
      });
    }

    // ✅ FIXED: Simple ObjectId query (Mongoose auto-converts)
    const registration = await Registration.findOneAndDelete({
      user: req.user._id,
      event: event._id
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'You are not registered for this event'
      });
    }

    await Analytics.updateRegistrationStats(event._id, 'unregister');

    const attendeeCount = await Registration.countDocuments({
      event: event._id,
      status: { $in: ['registered', 'attended'] }
    });

    const updatedEvent = await Event.findById(event._id)
      .populate('creator', 'firstName lastName studentId')
      .populate('organizer', 'firstName lastName studentId')
      .lean();

    updatedEvent.currentAttendees = attendeeCount;
    updatedEvent.availableSlots = event.maxAttendees - attendeeCount;

    res.json({
      success: true,
      message: 'Successfully unregistered from event',
      data: { 
        event: updatedEvent
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during unregistration',
      error: error.message
    });
  }
};

// ✅ NEW: Close registration for an event (Organizer only)
// @route   PATCH /api/events/:id/close-registration
// @access  Private (Organizer/Admin)
exports.closeRegistration = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is organizer, creator, or admin
    const isOrganizer = event.organizer && event.organizer.toString() === req.user._id.toString();
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only organizers can close registration'
      });
    }

    // Check event status
    if (event.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved events can have registration closed'
      });
    }

    // Check if already closed
    if (event.registrationClosed) {
      return res.status(400).json({
        success: false,
        message: 'Registration is already closed for this event'
      });
    }

    // Close registration
    await event.closeRegistration();

    res.json({
      success: true,
      message: 'Registration closed successfully',
      data: { 
        event: {
          _id: event._id,
          title: event.title,
          registrationClosed: true,
          closedAt: event.closedAt
        }
      }
    });
    
  } catch (error) {
    console.error('Error closing registration:', error);
    res.status(500).json({
      success: false,
      message: 'Server error closing registration',
      error: error.message
    });
  }
};

// ✅ NEW: Open registration for an event (Organizer only)
// @route   PATCH /api/events/:id/open-registration
// @access  Private (Organizer/Admin)
exports.openRegistration = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is organizer, creator, or admin
    const isOrganizer = event.organizer && event.organizer.toString() === req.user._id.toString();
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only organizers can open registration'
      });
    }

    // Check event status
    if (event.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved events can have registration opened'
      });
    }

    // Check if already open
    if (!event.registrationClosed) {
      return res.status(400).json({
        success: false,
        message: 'Registration is already open for this event'
      });
    }

    // Open registration
    await event.openRegistration();

    res.json({
      success: true,
      message: 'Registration opened successfully',
      data: { 
        event: {
          _id: event._id,
          title: event.title,
          registrationClosed: false,
          closedAt: null
        }
      }
    });
    
  } catch (error) {
    console.error('Error opening registration:', error);
    res.status(500).json({
      success: false,
      message: 'Server error opening registration',
      error: error.message
    });
  }
};

// @desc    Get count of user's active, uncompleted events (NEW FEATURE)
// @route   GET /api/events/active-count
// @access  Private (Organizer/Admin)
exports.getActiveEventCount = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'organizer' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Organizers and Admins can check active count.'
      });
    }

    const activeEventCount = await Event.countDocuments({
      creator: req.user._id,
      date: { $gt: new Date() }, // Event date is in the future
      status: { $nin: ['rejected', 'cancelled'] } // Status is not rejected or cancelled
    });

    res.json({
      success: true,
      data: { activeEventCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching active event count',
      error: error.message
    });
  }
};

// @desc    Delete event by ID (UPDATED: Organizers can delete their own approved events)
// @route   DELETE /api/events/:id
// @access  Private (Admin or Event Owner)
exports.deleteEvent = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isOrganizer = event.organizer && event.organizer.toString() === req.user._id.toString();

    // ✅ ADMIN: Can delete ANY event (approved, pending, draft, rejected)
    if (isAdmin) {
      // Admin can delete any event regardless of status
      await event.deleteOne();
      await Registration.deleteMany({ event: event._id });
      
      return res.json({
        success: true,
        message: 'Event and all related data deleted successfully (Admin)'
      });
    }
    
    // ✅ ORGANIZER/CREATOR: Can delete their OWN events (including approved ones)
    if (isCreator || isOrganizer) {
      // ✅ FIXED: Removed restriction - organizers can now delete approved events
      // Only add additional warnings for approved events with registrations
      if (event.status === 'approved') {
        const registrationCount = await Registration.countDocuments({ 
          event: event._id,
          status: { $in: ['registered', 'attended'] }
        });
        
        if (registrationCount > 0) {
          // Event has registrations - add warning but allow deletion
          await event.deleteOne();
          await Registration.deleteMany({ event: event._id });
          
          return res.json({
            success: true,
            message: `Event with ${registrationCount} registration(s) deleted successfully. All registrations have been removed.`
          });
        }
      }
      
      // Delete event with no registrations or non-approved status
      await event.deleteOne();
      await Registration.deleteMany({ event: event._id });
      
      return res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    }
    
    // ❌ NO PERMISSION
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only delete events you created or organized.' 
    });
    
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting event',
      error: error.message
    });
  }
};

// ✅ NEW: Get organizer events with analytics
// @desc    Get organizer's events with analytics data
// @route   GET /api/events/organizer/analytics
// @access  Private (Organizer)
exports.getOrganizerAnalytics = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get all events created or organized by the user
    const events = await Event.find({
      $or: [
        { creator: req.user._id },
        { organizer: req.user._id }
      ]
    })
    .populate('creator', 'firstName lastName studentId')
    .populate('organizer', 'firstName lastName studentId')
    .sort({ createdAt: -1 })
    .lean();

    // Get event IDs for approved events
    const approvedEventIds = events
      .filter(e => e.status === 'approved')
      .map(e => e._id);

    // Get registration counts for approved events
    const registrationCounts = await Registration.aggregate([
      {
        $match: {
          event: { $in: approvedEventIds },
          status: { $in: ['registered', 'attended'] }
        }
      },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 }
        }
      }
    ]);

    // Create count map
    const countMap = {};
    registrationCounts.forEach(rc => {
      countMap[rc._id.toString()] = rc.count;
    });

    // Add registration counts to events
    events.forEach(event => {
      if (event.status === 'approved') {
        event.currentAttendees = countMap[event._id.toString()] || 0;
        event.availableSlots = event.maxAttendees - event.currentAttendees;
      }
    });

    // Calculate analytics
    const approvedEvents = events.filter(e => e.status === 'approved');
    const pendingEvents = events.filter(e => e.status === 'pending');
    const draftEvents = events.filter(e => e.status === 'draft');
    const rejectedEvents = events.filter(e => e.status === 'rejected');

    const totalRegistrations = approvedEvents.reduce((acc, event) => 
      acc + (event.currentAttendees || 0), 0);
    
    const totalCapacity = approvedEvents.reduce((acc, event) => 
      acc + (event.maxAttendees || 0), 0);
    
    const avgFillRate = totalCapacity > 0 ? 
      Math.round((totalRegistrations / totalCapacity) * 100) : 0;

    // Calculate performance metrics
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

    // Media stats
    const totalImages = events.reduce((acc, event) => 
      acc + (event.images?.length || 0), 0);
    
    const totalVideos = events.reduce((acc, event) => 
      acc + (event.videos?.length || 0), 0);
    
    const eventsWithBanner = events.filter(e => e.bannerImage).length;

    res.json({
      success: true,
      data: {
        events,
        analytics: {
          summary: {
            totalEvents: events.length,
            approvedEvents: approvedEvents.length,
            pendingEvents: pendingEvents.length,
            draftEvents: draftEvents.length,
            rejectedEvents: rejectedEvents.length,
            totalRegistrations,
            avgFillRate,
            totalCapacity
          },
          performance: {
            highPerformanceEvents: highPerformanceEvents.length,
            lowPerformanceEvents: lowPerformanceEvents.length,
            averagePerformance: approvedEvents.length - highPerformanceEvents.length - lowPerformanceEvents.length
          },
          media: {
            totalImages,
            totalVideos,
            eventsWithBanner,
            totalMedia: totalImages + totalVideos
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching organizer analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching organizer analytics',
      error: error.message
    });
  }
};

// @desc    Get attendance list for an event (Organizer only)
// @route   GET /api/events/:id/attendance
// @access  Private (Organizer of the event)
exports.getAttendanceList = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is organizer of this event
    const isOrganizer = event.organizer && event.organizer.toString() === req.user._id.toString();
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only organizers can view attendance.'
      });
    }

    // Get all registrations for this event
    const registrations = await Registration.find({
      event: event._id,
      status: { $in: ['registered', 'attended'] }
    })
    .populate('user', 'firstName lastName studentId email gender')
    .sort({ 'user.lastName': 1, 'user.firstName': 1 });

    // Organize by gender
    const organizedList = {
      male: [],
      female: [],
      other: [],
      'prefer-not-to-say': []
    };

    registrations.forEach(registration => {
      const user = registration.user;
      const userInfo = {
        _id: user._id,
        studentId: user.studentId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        registrationId: registration._id,
        registrationStatus: registration.status,
        registeredAt: registration.registeredAt
      };

      if (user.gender === 'male') {
        organizedList.male.push(userInfo);
      } else if (user.gender === 'female') {
        organizedList.female.push(userInfo);
      } else if (user.gender === 'other') {
        organizedList.other.push(userInfo);
      } else {
        organizedList['prefer-not-to-say'].push(userInfo);
      }
    });

    // Sort each gender group alphabetically
    Object.keys(organizedList).forEach(gender => {
      organizedList[gender].sort((a, b) => {
        if (a.lastName.toLowerCase() < b.lastName.toLowerCase()) return -1;
        if (a.lastName.toLowerCase() > b.lastName.toLowerCase()) return 1;
        return a.firstName.toLowerCase().localeCompare(b.firstName.toLowerCase());
      });
    });

    // Count totals
    const totalAttendees = registrations.length;
    const summary = {
      total: totalAttendees,
      male: organizedList.male.length,
      female: organizedList.female.length,
      other: organizedList.other.length,
      preferNotToSay: organizedList['prefer-not-to-say'].length
    };

    res.json({
      success: true,
      data: {
        event: {
          _id: event._id,
          title: event.title,
          date: event.date,
          location: event.location,
          registrationClosed: event.registrationClosed
        },
        attendance: organizedList,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching attendance list:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendance list',
      error: error.message
    });
  }
};

// @desc    Mark user attendance (check-in)
// @route   PUT /api/events/:id/attendance/:registrationId
// @access  Private (Organizer of the event)
exports.markAttendance = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is organizer of this event
    const isOrganizer = event.organizer && event.organizer.toString() === req.user._id.toString();
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only organizers can mark attendance.'
      });
    }

    const registration = await Registration.findById(req.params.registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Update status to attended
    registration.status = 'attended';
    await registration.save();

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: { registration }
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking attendance',
      error: error.message
    });
  }
};