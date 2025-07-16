const Playa = require('../models/Playa');

class PlayaService {
  static async getAllPlayas() {
    try {
      const playas = await Playa.getAll();
      return {
        success: true,
        data: playas
      };
    } catch (error) {
      console.error('Error getting playas:', error);
      return {
        success: false,
        message: 'Error retrieving playas'
      };
    }
  }

  static async getPlayaById(id) {
    try {
      const playa = await Playa.findById(id);
      
      if (!playa) {
        return {
          success: false,
          message: 'Playa not found'
        };
      }

      return {
        success: true,
        data: playa
      };
    } catch (error) {
      console.error('Error getting playa:', error);
      return {
        success: false,
        message: 'Error retrieving playa'
      };
    }
  }
}

module.exports = PlayaService;