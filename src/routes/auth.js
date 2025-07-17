const express = require('express');
const AuthController = require('../controllers/AuthController');
const { validateLogin } = require('../middleware/validation');

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user
 * @access Public
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route GET /api/auth/check-users
 * @desc Check existing users (temporary endpoint)
 * @access Public
 */
router.get('/check-users', AuthController.checkUsers);

module.exports = router;