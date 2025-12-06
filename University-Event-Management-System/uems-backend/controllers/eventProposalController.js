const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Notification = require('../models/Notification');

// @desc    Create event proposal (draft)
// @route   POST /api/events/proposals
// @access  Private
exports.createProposal = async (req, res) => {
  try {
    // ✅ FIXED: REMOVED organizer event limit - Organizers can create unlimited events
    // (As per your clarification: "no limit at all")

    const {
      title,
      description,
      category,
      date,
      location,
      maxAttendees,
      tags
    } = req.body;

    // Create event as draft
    const event = await Event.create({
      title,
      description,
      category,
      date,
      location,
      maxAttendees: parseInt(maxAttendees),
      creator: req.user._id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      status: 'draft'
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('creator', 'firstName lastName studentId')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Event proposal created as draft',
      data: { 
        event: {
          _id: populatedEvent._id,
          title: populatedEvent.title,
          description: populatedEvent.description,
          category: populatedEvent.category,
          date: populatedEvent.date,
          location: populatedEvent.location,
          maxAttendees: populatedEvent.maxAttendees,
          creator: populatedEvent.creator,
          status: populatedEvent.status,
          tags: populatedEvent.tags,
          createdAt: populatedEvent.createdAt,
          updatedAt: populatedEvent.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error creating event proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating event proposal',
      error: error.message
    });
  }
};

// @desc    Submit proposal for admin approval
// @route   POST /api/events/proposals/:id/submit
// @access  Private (Event Creator OR Organizer) ✅ FIXED
exports.submitProposal = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event proposal not found'
      });
    }

    // ✅ FIXED: Allow both creator AND organizer to submit
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isOrganizer = event.organizer && event.organizer.toString() === req.user._id.toString();
    
    if (!isCreator && !isOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this proposal'
      });
    }

    // Only allow submission of draft events
    if (event.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit event with status: ${event.status}. Only draft events can be submitted.`
      });
    }

    // Update status to pending
    event.status = 'pending';
    await event.save();

    res.json({
      success: true,
      message: 'Event proposal submitted for admin approval',
      data: { event }
    });
  } catch (error) {
    console.error('Error in submitProposal:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting proposal',
      error: error.message
    });
  }
};

// @desc    Cancel pending submission (return to draft) - ✅ NEW FUNCTION
// @route   PUT /api/events/proposals/:id/cancel-submission
// @access  Private (Event Creator)
exports.cancelSubmission = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this submission'
      });
    }

    // Only allow cancellation of pending events
    if (event.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel event with status: ${event.status}. Only pending events can be cancelled.`
      });
    }

    // Return to draft status
    event.status = 'draft';
    await event.save();

    res.json({
      success: true,
      message: 'Event submission cancelled and returned to draft',
      data: { event }
    });
  } catch (error) {
    console.error('Error in cancelSubmission:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling submission',
      error: error.message
    });
  }
};

// @desc    Get user's event proposals WITH IMAGES AND ATTENDEE COUNTS
// @route   GET /api/events/proposals/my-events
// @access  Private
exports.getMyProposals = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { creator: req.user._id };
    if (status) filter.status = status;

    const events = await Event.find(filter)
      .populate('creator', 'firstName lastName studentId')
      .populate('organizer', 'firstName lastName studentId')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(filter);

    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const eventObj = event.toObject();
        
        const attendeeCount = await Registration.countDocuments({
          event: event._id,
          status: { $in: ['registered', 'attended'] }
        });
        
        eventObj.currentAttendees = attendeeCount;
        eventObj.availableSlots = event.maxAttendees - attendeeCount;
        
        return eventObj;
      })
    );

    res.json({
      success: true,
      data: {
        events: eventsWithCounts,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEvents: total
      }
    });
  } catch (error) {
    console.error('Error in getMyProposals:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching proposals',
      error: error.message
    });
  }
};

// @desc    Update event proposal (only draft/pending)
// @route   PUT /api/events/proposals/:id
// @access  Private (Event Creator)
exports.updateProposal = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event proposal not found'
      });
    }

    // Check ownership and status
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this proposal'
      });
    }

    if (!['draft', 'pending'].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update approved or rejected events'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'category', 'date', 'location', 
      'maxAttendees', 'tags', 'bannerImage', 'images', 'videos'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    // If status was pending and fields changed, keep as pending
    if (event.status === 'pending') {
      event.status = 'pending';
    }

    await event.save();
    await event.populate('creator', 'firstName lastName studentId');

    res.json({
      success: true,
      message: 'Event proposal updated successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Error in updateProposal:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating proposal',
      error: error.message
    });
  }
};

// @desc    Delete event proposal (draft, pending, OR rejected) - ✅ FIXED PERMISSIONS
// @route   DELETE /api/events/proposals/:id
// @access  Private (Admin/Event Creator/Organizer)
exports.deleteProposal = async (req, res) => {
  try {
    console.log('🔍 Delete proposal request:', req.params.id, 'user:', req.user._id);
    
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event proposal not found'
      });
    }

    // ✅ FIXED: Enhanced permission checks
    const isAdmin = req.user.role === 'admin';
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isOrganizer = event.organizer && event.organizer.toString() === req.user._id.toString();
    
    // Admin can delete any draft/pending/rejected event
    // Organizer/Creator can only delete their own draft/pending/rejected events
    if (!isAdmin && !isCreator && !isOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this proposal'
      });
    }

    // ✅ FIXED: Allow deletion of drafts, pending, AND rejected events with clear messages
    if (!['draft', 'pending', 'rejected'].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: isAdmin 
          ? 'Admin can only delete draft, pending, or rejected events' 
          : 'Only draft, pending, or rejected events can be deleted'
      });
    }

    // Delete the event
    await Event.findByIdAndDelete(req.params.id);

    // Also delete any associated registrations (just in case)
    await Registration.deleteMany({ event: req.params.id });

    console.log('✅ Draft/Pending/Rejected event deleted successfully:', req.params.id);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error in deleteProposal:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting proposal',
      error: error.message
    });
  }
};