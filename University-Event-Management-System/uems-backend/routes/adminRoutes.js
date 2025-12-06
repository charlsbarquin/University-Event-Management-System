const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, adminAuth } = require('../middleware/auth'); // Import BOTH

// Add auth middleware before adminAuth to set req.user
router.get('/pending-events', auth, adminAuth, adminController.getPendingEvents);
router.put('/events/:id/approve', auth, adminAuth, adminController.approveEvent);
router.put('/events/:id/reject', auth, adminAuth, adminController.rejectEvent);
router.get('/statistics', auth, adminAuth, adminController.getStatistics);

// ✅ NEW: Organizer analytics endpoint
router.get('/organizer-analytics/:organizerId', auth, adminController.getOrganizerAnalytics);

// ✅ NEW: Comprehensive admin analytics
router.get('/analytics/comprehensive', auth, adminAuth, adminController.getComprehensiveAnalytics);

module.exports = router;