const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Registration = require('../models/Registration');

// @desc    Get pending events for approval
// @route   GET /api/admin/pending-events
// @access  Private (Admin)
exports.getPendingEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const events = await Event.find({ status: 'pending' })
      .populate('creator', 'firstName lastName studentId email')
      .select('-videos') // Lightweight for list view
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        events,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPending: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching pending events',
      error: error.message
    });
  }
};

// @desc    Approve event proposal
// @route   PUT /api/admin/events/:id/approve
// @access  Private (Admin)
exports.approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Event is not pending approval'
      });
    }

    // Approve the event (this will auto-promote creator to organizer)
    await event.approveEvent(req.user._id);

    // Create notification for event creator
    const notification = await Notification.create({
      user: event.creator,
      type: 'event_approved',
      title: 'Event Proposal Approved',
      message: `Your event "${event.title}" has been approved! You are now an Organizer.`,
      relatedEvent: event._id,
      actionUrl: `/events/${event._id}`
    });

    // Add notification to user's notifications array
    await User.findByIdAndUpdate(event.creator, {
      $push: { notifications: notification._id }
    });

    res.json({
      success: true,
      message: 'Event approved successfully! Creator promoted to Organizer.',
      data: { event }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error approving event',
      error: error.message
    });
  }
};

// @desc    Reject event proposal
// @route   PUT /api/admin/events/:id/reject
// @access  Private (Admin)
exports.rejectEvent = async (req, res) => {
  try {
    const { rejectionNotes } = req.body;

    if (!rejectionNotes) {
      return res.status(400).json({
        success: false,
        message: 'Rejection notes are required'
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Event is not pending approval'
      });
    }

    // Update event status and notes
    event.status = 'rejected';
    event.approvalNotes = rejectionNotes;
    event.approvedBy = req.user._id;
    event.approvedAt = new Date();
    await event.save();

    // Create notification for event creator
    const notification = await Notification.create({
      user: event.creator,
      type: 'event_rejected',
      title: 'Event Proposal Rejected',
      message: `Your event "${event.title}" was rejected. Reason: ${rejectionNotes}`,
      relatedEvent: event._id,
      actionUrl: `/events/proposals/${event._id}`
    });

    // Add notification to user's notifications array
    await User.findByIdAndUpdate(event.creator, {
      $push: { notifications: notification._id }
    });

    res.json({
      success: true,
      message: 'Event rejected successfully',
      data: { event }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error rejecting event',
      error: error.message
    });
  }
};

// @desc    Get system-wide statistics
// @route   GET /api/admin/statistics
// @access  Private (Admin)
exports.getStatistics = async (req, res) => {
  try {
    // Total events by status
    const eventStats = await Event.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Total users by role
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentEvents = await Event.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    const recentRegistrations = await Registration.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    // Popular categories
    const popularCategories = await Event.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        eventStats,
        userStats,
        recentActivity: {
          events: recentEvents,
          registrations: recentRegistrations
        },
        popularCategories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics',
      error: error.message
    });
  }
};

// ✅ NEW: Get organizer analytics
// @desc    Get organizer-specific analytics
// @route   GET /api/admin/organizer-analytics/:organizerId
// @access  Private (Admin or Organizer)
exports.getOrganizerAnalytics = async (req, res) => {
  try {
    const { organizerId } = req.params;
    
    // Check if user has permission
    const isAdmin = req.user.role === 'admin';
    const isOrganizer = req.user._id.toString() === organizerId;
    
    if (!isAdmin && !isOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get organizer's events
    const organizerEvents = await Event.find({
      $or: [
        { creator: organizerId },
        { organizer: organizerId }
      ]
    }).populate('creator', 'firstName lastName studentId');

    // Calculate analytics
    const totalEvents = organizerEvents.length;
    const approvedEvents = organizerEvents.filter(e => e.status === 'approved');
    const pendingEvents = organizerEvents.filter(e => e.status === 'pending');
    const draftEvents = organizerEvents.filter(e => e.status === 'draft');
    const rejectedEvents = organizerEvents.filter(e => e.status === 'rejected');

    // Get registration counts
    const eventIds = approvedEvents.map(e => e._id);
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

    // Calculate fill rates
    let totalRegistrations = 0;
    let totalCapacity = 0;
    let highPerformanceCount = 0;
    let lowPerformanceCount = 0;
    
    approvedEvents.forEach(event => {
      const registration = registrationCounts.find(rc => rc._id.toString() === event._id.toString());
      const attendeeCount = registration ? registration.count : 0;
      totalRegistrations += attendeeCount;
      totalCapacity += event.maxAttendees || 0;
      
      if (event.maxAttendees > 0) {
        const fillRate = (attendeeCount / event.maxAttendees) * 100;
        if (fillRate >= 70) highPerformanceCount++;
        if (fillRate < 30) lowPerformanceCount++;
      }
    });

    const avgFillRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

    // Get upcoming events
    const upcomingEvents = approvedEvents.filter(event => 
      new Date(event.date) > new Date()
    ).slice(0, 5);

    // Get recent activity
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentEvents = await Event.countDocuments({
      $or: [
        { creator: organizerId },
        { organizer: organizerId }
      ],
      createdAt: { $gte: weekAgo }
    });

    res.json({
      success: true,
      data: {
        organizer: await User.findById(organizerId).select('firstName lastName studentId email role'),
        summary: {
          totalEvents,
          approvedEvents: approvedEvents.length,
          pendingEvents: pendingEvents.length,
          draftEvents: draftEvents.length,
          rejectedEvents: rejectedEvents.length,
          totalRegistrations,
          avgFillRate,
          upcomingEvents: upcomingEvents.length,
          recentEvents
        },
        performance: {
          highPerformanceCount,
          lowPerformanceCount,
          averagePerformance: approvedEvents.length - highPerformanceCount - lowPerformanceCount
        },
        upcomingEvents: upcomingEvents.map(event => ({
          _id: event._id,
          title: event.title,
          date: event.date,
          location: event.location,
          maxAttendees: event.maxAttendees,
          currentAttendees: registrationCounts.find(rc => rc._id.toString() === event._id.toString())?.count || 0
        }))
      }
    });
  } catch (error) {
    console.error('Organizer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching organizer analytics',
      error: error.message
    });
  }
};

// ✅ NEW: Get comprehensive admin analytics dashboard (UPDATED - No Attendance Data)
// @desc    Get comprehensive admin analytics
// @route   GET /api/admin/analytics/comprehensive
// @access  Private (Admin)
exports.getComprehensiveAnalytics = async (req, res) => {
  try {
    console.log('📊 Loading comprehensive admin analytics...');
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Execute all analytics queries in parallel (removed attendance query)
    const [
      eventStats,
      userStats,
      popularCategories,
      topEvents,
      registrationTrends,
      userEngagement
    ] = await Promise.all([
      // 1. Event Statistics by Status
      Event.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // 2. User Statistics by Role
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // 3. Popular Categories (Top 5)
      Event.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // 4. Top Performing Events (by fill rate, min 70%+)
      Event.aggregate([
        { 
          $match: { 
            status: 'approved',
            maxAttendees: { $gt: 0 }
          }
        },
        {
          $project: {
            title: 1,
            date: 1,
            location: 1,
            category: 1,
            maxAttendees: 1,
            currentAttendees: 1,
            creator: 1,
            fillRate: {
              $multiply: [
                { $divide: [{ $ifNull: ['$currentAttendees', 0] }, '$maxAttendees'] },
                100
              ]
            }
          }
        },
        { $match: { fillRate: { $gte: 70 } } },
        { $sort: { fillRate: -1 } },
        { $limit: 5 }
      ]),
      
      // 5. Registration Trends (Last 30 Days)
      Registration.aggregate([
        {
          $match: {
            createdAt: { $gte: oneMonthAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),
      
      // 6. User Engagement
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            activeCount: { $sum: { $cond: ['$isActive', 1, 0] } }
          }
        }
      ])
    ]);

    // Get recent activity counts
    const recentActivity = {
      events: await Event.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      registrations: await Registration.countDocuments({ createdAt: { $gte: oneWeekAgo } })
    };

    // Calculate derived metrics (removed attendance metrics)
    const totalEvents = eventStats.reduce((acc, stat) => acc + stat.count, 0);
    const totalUsers = userStats.reduce((acc, stat) => acc + stat.count, 0);
    const approvedEvents = eventStats.find(s => s._id === 'approved')?.count || 0;
    const pendingEvents = eventStats.find(s => s._id === 'pending')?.count || 0;
    const approvalRate = totalEvents > 0 ? Math.round((approvedEvents / totalEvents) * 100) : 0;
    
    // Calculate user engagement
    const activeUsers = userEngagement.reduce((acc, stat) => acc + stat.activeCount, 0);
    const userActivityRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    
    // Format registration trends for chart
    const formattedTrends = registrationTrends.map(day => ({
      date: day._id,
      count: day.count
    }));

    // Format top events
    const formattedTopEvents = topEvents.map(event => ({
      _id: event._id,
      title: event.title,
      date: event.date,
      location: event.location,
      category: event.category,
      fillRate: Math.round(event.fillRate),
      maxAttendees: event.maxAttendees,
      currentAttendees: event.currentAttendees || 0
    }));

    // Calculate system health score (updated - no punctuality component)
    const healthScore = Math.min(100, Math.round(
      (approvalRate * 0.4) +
      (userActivityRate * 0.4) +
      (recentActivity.events > 5 ? 20 : recentActivity.events > 2 ? 10 : 0)
    ));

    // Generate recommendations (updated - no attendance-related recommendations)
    const recommendations = [];
    if (approvalRate < 60) {
      recommendations.push('Low approval rate: Review pending events more frequently.');
    }
    if (userActivityRate < 70) {
      recommendations.push('Low user activity: Consider engaging inactive users.');
    }
    if (totalEvents < 10) {
      recommendations.push('Low event count: Encourage more event creation.');
    }
    if (recentActivity.events < 2) {
      recommendations.push('Low recent activity: Promote event creation to users.');
    }

    res.json({
      success: true,
      data: {
        timestamp: now.toISOString(),
        
        // Summary Metrics (updated - no attendance)
        summary: {
          totalEvents,
          totalUsers,
          approvedEvents,
          pendingEvents,
          activeUsers,
          approvalRate,
          userActivityRate,
          systemHealthScore: healthScore,
          weeklyGrowth: recentActivity.events || 0,
          recentRegistrations: recentActivity.registrations || 0
        },
        
        // Detailed Statistics
        statistics: {
          eventStats,
          userStats,
          recentActivity,
          popularCategories
        },
        
        // Performance Analysis
        performance: {
          topEvents: formattedTopEvents,
          totalTopEvents: formattedTopEvents.length,
          averageFillRate: formattedTopEvents.length > 0 ? 
            Math.round(formattedTopEvents.reduce((acc, e) => acc + e.fillRate, 0) / formattedTopEvents.length) : 0,
          highPerformanceEvents: formattedTopEvents.filter(e => e.fillRate >= 80).length,
          moderatePerformanceEvents: formattedTopEvents.filter(e => e.fillRate >= 50 && e.fillRate < 80).length
        },
        
        // Trends
        trends: {
          registrationTrends: formattedTrends,
          dailyAverage: formattedTrends.length > 0 ?
            Math.round(formattedTrends.reduce((acc, day) => acc + day.count, 0) / formattedTrends.length) : 0,
          peakDay: formattedTrends.reduce((max, day) => day.count > max.count ? day : max, { count: 0, date: '' }),
          totalRegistrations: formattedTrends.reduce((sum, day) => sum + day.count, 0)
        },
        
        // Insights & Recommendations
        insights: {
          recommendations,
          healthLevel: healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention',
          busyPeriods: formattedTrends.filter(day => day.count > 5).length > 10 ? 'High Activity' : 'Normal',
          growthTrend: recentActivity.events > 5 ? 'Growing' : recentActivity.events > 2 ? 'Stable' : 'Slow'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in comprehensive analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching comprehensive analytics',
      error: error.message
    });
  }
};