const express = require('express');
const UserController = require('../controllers/UserController');

const router = express.Router();

// Rutas para gestión de usuarios
router.get('/', UserController.getAllUsers);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id/:tipo', UserController.deleteUser);
router.get('/:id/:tipo/playas', UserController.getUserPlayas);

module.exports = router;