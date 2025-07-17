const express = require('express');
const PlayaController = require('../controllers/PlayaController');
const { authenticateUser, requireAdmin, checkPlayaAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/playas
 * @desc Get all playas (filtered by user type)
 * @access Private
 */
router.get('/', authenticateUser, PlayaController.getAllPlayas);

/**
 * @route POST /api/playas
 * @desc Create new playa (Admin only)
 * @access Private - Admin
 */
router.post('/', authenticateUser, requireAdmin, PlayaController.createPlaya);

/**
 * @route PUT /api/playas/:id
 * @desc Update playa (Admin only)
 * @access Private - Admin
 */
router.put('/:id', authenticateUser, requireAdmin, PlayaController.updatePlaya);

/**
 * @route DELETE /api/playas/:id
 * @desc Delete playa (Admin only)
 * @access Private - Admin
 */
router.delete('/:id', authenticateUser, requireAdmin, PlayaController.deletePlaya);

/**
 * @route GET /api/playas/:id
 * @desc Get specific playa details
 * @access Private - Admin or assigned employee
 */
router.get('/:id', authenticateUser, checkPlayaAccess, PlayaController.getPlayaById);

module.exports = router;