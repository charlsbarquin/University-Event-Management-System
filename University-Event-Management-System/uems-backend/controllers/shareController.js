const Event = require('../models/Event');
const Analytics = require('../models/Analytics');
const Notification = require('../models/Notification');

// @desc    Generate shareable links for event
// @route   GET /api/share/events/:id
// @access  Private (Admin + Event Owner + Public for approved events)
exports.generateShareLinks = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'firstName lastName')
      .populate('organizer', 'firstName lastName');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permissions - only allow sharing for approved events
    // OR for admin/owner even if pending/draft (for preview)
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && event.creator && event.creator._id.toString() === req.user._id.toString();
    
    if (event.status !== 'approved' && !isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only approved events can be shared publicly'
      });
    }

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5000';
    const eventUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/events/${event._id}`;
    const shareUrl = event.shareableLink || `${baseUrl}/api/share/events/${event._id}/redirect`;

    // Social media share links with pre-filled content for better visualization
    const shareLinks = {
      direct: shareUrl,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(`Check out this event: ${event.title}`)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`🎉 ${event.title} - Don't miss out!`)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${event.title} - ${shareUrl}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      email: `mailto:?subject=${encodeURIComponent(`Event Invitation: ${event.title}`)}&body=${encodeURIComponent(`You're invited to ${event.title}!\n\n${event.description}\n\nDate: ${new Date(event.date).toLocaleDateString()}\nLocation: ${event.location}\n\nJoin here: ${shareUrl}`)}`
    };

    // Shareable content for social media previews
    const shareContent = {
      title: event.title,
      description: event.description.length > 150 
        ? event.description.substring(0, 150) + '...' 
        : event.description,
      image: event.bannerImage 
        ? `${process.env.SERVER_URL}${event.bannerImage}`
        : `${baseUrl}/default-event-banner.jpg`,
      eventDate: event.date,
      location: event.location,
      organizer: event.organizer ? `${event.organizer.firstName} ${event.organizer.lastName}` : 'Bicol University Polangui'
    };

    // If user is authenticated and sharing, track the share action
    if (req.user) {
      const platform = req.query.platform || 'direct';
      await Analytics.updateShareCount(event._id, platform);

      // If admin is sharing, create notification for event owner
      if (isAdmin && !isOwner && event.organizer) {
        await Notification.create({
          user: event.organizer._id,
          type: 'admin_announcement',
          title: 'Your Event is Being Promoted!',
          message: `An admin has shared your event "${event.title}" on ${platform}.`,
          relatedEvent: event._id,
          actionUrl: `/events/${event._id}/analytics`
        });
      }
    }

    res.json({
      success: true,
      message: 'Share links generated successfully',
      data: {
        event: {
          _id: event._id,
          title: event.title,
          status: event.status
        },
        shareUrl,
        shareLinks,
        shareContent,
        qrCode: `${process.env.SERVER_URL}/api/share/events/${event._id}/qr` // QR code endpoint for future
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error generating share links',
      error: error.message
    });
  }
};

// @desc    Track share clicks and redirect to event
// @route   GET /api/share/events/:id/redirect
// @access  Public
exports.trackShareClick = async (req, res) => {
  try {
    const { platform = 'direct', source } = req.query;
    const event = await Event.findById(req.params.id);

    if (!event || event.status !== 'approved') {
      return res.redirect(`${process.env.CLIENT_URL}/events/not-found`);
    }

    console.log(`🔗 Share click tracked: Event ${event._id}, Platform: ${platform}`);

    // Track share click in analytics
    await Analytics.updateShareCount(event._id, platform);

    // Update unique visitors for this share source
    await Analytics.findOneAndUpdate(
      { event: event._id, date: { $gte: new Date().setHours(0,0,0,0) } },
      { 
        $inc: { 
          uniqueVisitors: 1,
          pageViews: 1,
          ...(source && { [`shares.${source}`]: 1 })
        } 
      },
      { upsert: true }
    );

    // Redirect to actual event page on frontend WITH tracking parameter
    const frontendUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/events/${event._id}?source=shared&platform=${platform}`;
    console.log(`🔄 Redirecting to: ${frontendUrl}`);
    
    res.redirect(frontendUrl);

  } catch (error) {
    console.error('Redirect error:', error);
    // Fallback redirect if error
    res.redirect(process.env.CLIENT_URL || 'http://localhost:3000');
  }
};

// @desc    Get event share analytics
// @route   GET /api/share/events/:id/analytics
// @access  Private (Admin + Event Owner)
exports.getShareAnalytics = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isOwner = event.organizer && event.organizer.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view share analytics for this event'
      });
    }

    // Get share analytics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const shareAnalytics = await Analytics.aggregate([
      {
        $match: {
          event: event._id,
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalShares: { 
            $sum: { 
              $add: [
                '$shares.facebook', 
                '$shares.twitter', 
                '$shares.whatsapp', 
                '$shares.direct'
              ]
            } 
          },
          facebookShares: { $sum: '$shares.facebook' },
          twitterShares: { $sum: '$shares.twitter' },
          whatsappShares: { $sum: '$shares.whatsapp' },
          directShares: { $sum: '$shares.direct' },
          uniqueVisitors: { $sum: '$uniqueVisitors' },
          pageViews: { $sum: '$pageViews' }
        }
      }
    ]);

    // Get daily trend for visualization
    const dailyTrend = await Analytics.aggregate([
      {
        $match: {
          event: event._id,
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$date',
          shares: { 
            $sum: { 
              $add: [
                '$shares.facebook', 
                '$shares.twitter', 
                '$shares.whatsapp', 
                '$shares.direct'
              ]
            } 
          },
          visitors: { $sum: '$uniqueVisitors' },
          views: { $sum: '$pageViews' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const analytics = shareAnalytics[0] || {
      totalShares: 0,
      facebookShares: 0,
      twitterShares: 0,
      whatsappShares: 0,
      directShares: 0,
      uniqueVisitors: 0,
      pageViews: 0
    };

    res.json({
      success: true,
      data: {
        event: {
          _id: event._id,
          title: event.title,
          shareableLink: event.shareableLink
        },
        overview: analytics,
        dailyTrend,
        timePeriod: '30days'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching share analytics',
      error: error.message
    });
  }
};

// @desc    Bulk share events (for admin promotional campaigns)
// @route   POST /api/share/bulk
// @access  Private (Admin only)
exports.bulkShareEvents = async (req, res) => {
  try {
    const { eventIds, platforms, message } = req.body;

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Event IDs array is required'
      });
    }

    // Get all events
    const events = await Event.find({ 
      _id: { $in: eventIds },
      status: 'approved' 
    }).populate('organizer', 'firstName lastName');

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No approved events found for sharing'
      });
    }

    const shareResults = events.map(event => {
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const shareUrl = event.shareableLink || `${baseUrl}/events/${event._id}`;

      const shareLinks = {};
      const selectedPlatforms = platforms || ['facebook', 'twitter', 'whatsapp'];

      selectedPlatforms.forEach(platform => {
        switch (platform) {
          case 'facebook':
            shareLinks.facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
            break;
          case 'twitter':
            shareLinks.twitter = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message || event.title)}`;
            break;
          case 'whatsapp':
            shareLinks.whatsapp = `https://wa.me/?text=${encodeURIComponent(`${message || event.title} - ${shareUrl}`)}`;
            break;
        }
      });

      // Notify event owners about admin promotion
      if (event.organizer) {
        Notification.create({
          user: event.organizer._id,
          type: 'admin_announcement',
          title: 'Admin Promotion Campaign',
          message: `Your event "${event.title}" is included in an admin promotion campaign.`,
          relatedEvent: event._id,
          actionUrl: `/events/${event._id}/analytics`
        });
      }

      return {
        eventId: event._id,
        title: event.title,
        shareLinks,
        status: 'success'
      };
    });

    res.json({
      success: true,
      message: `Generated share links for ${events.length} events`,
      data: {
        campaign: {
          totalEvents: events.length,
          platforms: platforms || ['facebook', 'twitter', 'whatsapp'],
          message: message || 'Default promotion message'
        },
        results: shareResults
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in bulk sharing',
      error: error.message
    });
  }
};