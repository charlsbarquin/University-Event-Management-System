const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  checkInTime: {
    type: Date,
    default: Date.now
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // For analytics - late/on-time tracking
  checkInStatus: {
    type: String,
    enum: ['early', 'on_time', 'late'],
    default: 'on_time'
  }
}, {
  timestamps: true
});

// Prevent duplicate check-ins
attendanceSchema.index({ user: 1, event: 1 }, { unique: true });

// Calculate check-in status based on event time
attendanceSchema.pre('save', async function(next) {
  const Event = mongoose.model('Event');
  const event = await Event.findById(this.event);
  
  if (event) {
    const eventTime = new Date(event.date);
    const checkInTime = new Date(this.checkInTime);
    const timeDifference = eventTime.getTime() - checkInTime.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    
    if (hoursDifference > 2) {
      this.checkInStatus = 'early';
    } else if (hoursDifference < -1) {
      this.checkInStatus = 'late';
    } else {
      this.checkInStatus = 'on_time';
    }
  }
  
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);