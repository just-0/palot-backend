const Admin = require('../models/Admin');
const config = require('../config/server');

class AuthService {
  static async login(username, password) {
    try {
      if (!username || !password) {
        return {
          success: false,
          code: config.loginErrors.DB_ERROR,
          message: 'Username and password are required'
        };
      }

      const admin = await Admin.findByUsername(username);
      
      if (!admin) {
        return {
          success: false,
          code: config.loginErrors.USER_NOT_FOUND,
          message: 'User not found'
        };
      }

      if (password !== admin.hashed) {
        return {
          success: false,
          code: config.loginErrors.WRONG_PASSWORD,
          message: 'Invalid password'
        };
      }

      return {
        success: true,
        message: 'Login successful',
        user: {
          nombre: admin.nombre
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        code: config.loginErrors.DB_ERROR,
        message: 'Database error'
      };
    }
  }
}

module.exports = AuthService;