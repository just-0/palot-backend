const PlayaService = require('../services/PlayaService');
const config = require('../config/server');

class PlayaController {
  static async getAllPlayas(req, res) {
    try {
      const result = await PlayaService.getAllPlayas();

      if (result.success) {
        res.status(config.httpCodes.OK).json(result.data);
      } else {
        res.status(config.httpCodes.INTERNAL_ERROR).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Get playas controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = PlayaController;