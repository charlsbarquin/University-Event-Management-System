const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['academic', 'cultural', 'sports', 'workshop', 'seminar', 'social', 'other']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true
  },
  maxAttendees: {
    type: Number,
    required: [true, 'Maximum attendees is required'],
    min: [1, 'Must have at least 1 attendee']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // VISUALIZATION: Banner for event cards/lists
  bannerImage: {
    type: String,
    default: null
  },
  // VISUALIZATION: Multiple images for event gallery
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // VISUALIZATION: Videos for multimedia content
  videos: [{
    url: String,
    title: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled'],
    default: 'draft'
  },
  // ✅ NEW: Registration closure feature
  registrationClosed: {
    type: Boolean,
    default: false
  },
  closedAt: {
    type: Date,
    default: null
  },
  approvalNotes: {
    type: String,
    maxlength: [500, 'Approval notes cannot exceed 500 characters']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  // Social sharing feature
  shareableLink: {
    type: String,
    unique: true,
    sparse: true
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate TRACKABLE shareable link when event is approved
eventSchema.methods.generateShareableLink = function() {
  const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
  // Create trackable backend link that redirects to frontend
  this.shareableLink = `${baseUrl}/api/share/events/${this._id}/redirect`;
  return this.save();
};

// Update organizer when approved and promote user to organizer
eventSchema.methods.approveEvent = async function(adminId) {
  try {
    this.status = 'approved';
    this.approvedBy = adminId;
    this.approvedAt = new Date();
    this.organizer = this.creator; // Creator becomes organizer
    
    await this.generateShareableLink();
    
    // FIX: Get the actual User document to call promoteToOrganizer
    const User = mongoose.model('User');
    const creatorUser = await User.findById(this.creator);
    
    if (creatorUser) {
      await creatorUser.promoteToOrganizer();
      console.log(`✅ User ${creatorUser.studentId} promoted to organizer`);
    } else {
      console.log('❌ Creator user not found');
    }
    
    return this.save();
  } catch (error) {
    console.error('Error in approveEvent:', error);
    throw error;
  }
};

// ✅ NEW: Close registration method
eventSchema.methods.closeRegistration = function() {
  this.registrationClosed = true;
  this.closedAt = new Date();
  return this.save();
};

// ✅ NEW: Open registration method
eventSchema.methods.openRegistration = function() {
  this.registrationClosed = false;
  this.closedAt = null;
  return this.save();
};

// Virtual for registration count - FIXED VERSION
eventSchema.virtual('currentAttendees', {
  ref: 'Registration',
  localField: '_id',
  foreignField: 'event',
  count: true,
  match: { status: { $in: ['registered', 'attended'] } }
});

// Virtual for available slots
eventSchema.virtual('availableSlots').get(function() {
  if (this.currentAttendees === undefined) return this.maxAttendees;
  return this.maxAttendees - this.currentAttendees;
});
 
eventSchema.set('toJSON', { virtuals: true });

// Add toJSON transform to avoid circular references
eventSchema.methods.toJSON = function() {
  const event = this.toObject();
  delete event.__v; // Remove version key
  return event;
};

module.exports = mongoose.model('Event', eventSchema);