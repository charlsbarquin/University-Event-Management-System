const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { auth } = require('../middleware/auth');
const { eventOwnership } = require('../middleware/eventOwnership');

// Public routes
router.get('/', eventController.getEvents);

// FIX: Apply conditional 'auth' to fetch user registration status
router.get('/:id', auth, eventController.getEvent);

// NEW FEATURE: Utility route to check event creation limit
router.get('/active-count', auth, eventController.getActiveEventCount);

// ✅ NEW: Organizer analytics route
router.get('/organizer/analytics', auth, eventController.getOrganizerAnalytics);

// ✅ NEW: Attendance routes
router.get('/:id/attendance', auth, eventController.getAttendanceList);
router.put('/:id/attendance/:registrationId', auth, eventController.markAttendance);

// ✅ NEW: Registration control routes
router.patch('/:id/close-registration', auth, eventController.closeRegistration);
router.patch('/:id/open-registration', auth, eventController.openRegistration);

// Protected routes (require authentication)
router.post('/:id/register', auth, eventController.registerForEvent);
router.delete('/:id/register', auth, eventController.unregisterFromEvent);

// NEW FEATURE: Delete event (requires Admin or Creator role)
router.delete('/:id', auth, eventController.deleteEvent);

module.exports = router;