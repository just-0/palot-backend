const express = require('express');
const PlayaController = require('../controllers/PlayaController');

const router = express.Router();

/**
 * @route GET /api/playas
 * @desc Get all playas
 * @access Public
 */
router.get('/', PlayaController.getAllPlayas);

module.exports = router;