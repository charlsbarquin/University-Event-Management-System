const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Core metrics only
  totalRegistrations: {
    type: Number,
    default: 0
  },
  attendedCount: {
    type: Number,
    default: 0
  },
  // Simple share tracking
  shareCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Simple registration update
analyticsSchema.statics.updateRegistrationStats = async function(eventId, action) {
  const update = {};
  
  if (action === 'register') {
    update.$inc = { totalRegistrations: 1 };
  } else if (action === 'attend') {
    update.$inc = { attendedCount: 1 };
  }
  
  return this.findOneAndUpdate(
    { event: eventId, date: { $gte: new Date().setHours(0,0,0,0) } },
    update,
    { upsert: true, new: true }
  );
};

// Simple share update
analyticsSchema.statics.updateShareCount = async function(eventId) {
  return this.findOneAndUpdate(
    { event: eventId, date: { $gte: new Date().setHours(0,0,0,0) } },
    { $inc: { shareCount: 1 } },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('Analytics', analyticsSchema);