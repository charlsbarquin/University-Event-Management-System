const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['registered', 'attended', 'cancelled', 'waitlisted'],
    default: 'registered'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  source: {
    type: String,
    enum: ['direct', 'shared_link', 'recommendation'],
    default: 'direct'
  }
}, {
  timestamps: true
});

// Prevent duplicate registrations
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

// Only allow registration for approved events
registrationSchema.pre('save', async function(next) {
  const Event = mongoose.model('Event');
  const event = await Event.findById(this.event);
  
  if (!event || event.status !== 'approved') {
    throw new Error('Cannot register for unapproved or cancelled events');
  }
  
  // Check capacity
  const currentRegistrations = await mongoose.model('Registration').countDocuments({
    event: this.event,
    status: { $in: ['registered', 'attended'] }
  });
  
  if (currentRegistrations >= event.maxAttendees) {
    this.status = 'waitlisted';
  }
  
  next();
});

module.exports = mongoose.model('Registration', registrationSchema);