const express = require('express');
const router = express.Router();
const eventProposalController = require('../controllers/eventProposalController');
const { auth } = require('../middleware/auth');

router.post('/', auth, eventProposalController.createProposal);
router.post('/:id/submit', auth, eventProposalController.submitProposal);
router.get('/my-events', auth, eventProposalController.getMyProposals);
router.put('/:id', auth, eventProposalController.updateProposal);
router.delete('/:id', auth, eventProposalController.deleteProposal); // ✅ ADDED
router.put('/:id/cancel-submission', auth, eventProposalController.cancelSubmission);

module.exports = router;