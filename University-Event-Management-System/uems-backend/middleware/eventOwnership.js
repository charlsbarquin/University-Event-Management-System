const Event = require('../models/Event');

const eventOwnership = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is admin OR event owner
    const isAdmin = req.user.role === 'admin';
    const isOwner = event.organizer && event.organizer.toString() === req.user._id.toString();
    const isCreator = event.creator.toString() === req.user._id.toString();

    if (isAdmin || isOwner || isCreator) {
      req.event = event;
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied. Not authorized for this event.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error checking event ownership'
    });
  }
};

module.exports = { eventOwnership };