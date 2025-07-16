const CameraService = require('../services/CameraService');
const config = require('../config/server');

class CameraController {
  static async getPlatesFromCamera(req, res) {
    try {
      const idPlaya = req.query.id_playa;
      console.log("📷 PLACAS CAMARA - Playa ID:", idPlaya);
      
      const result = await CameraService.getPlatesFromCamera(idPlaya);

      res.status(config.httpCodes.OK).json(result.data);
    } catch (error) {
      console.error('Camera controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = CameraController;