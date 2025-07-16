const AuthService = require('../services/AuthService');
const config = require('../config/server');

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);

      if (result.success) {
        res.status(config.httpCodes.OK).json(result);
      } else {
        res.status(config.httpCodes.UNAUTHORIZED).json(result);
      }
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = AuthController;