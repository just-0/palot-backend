const axios = require('axios');
const Auto = require('../models/Auto');
const utils = require('../utils/xmlParser');
const config = require('../config/server');

class CameraService {
  static async getPlatesFromCamera(idPlaya) {
    try {
      const response = await axios({
        method: 'GET',
        url: config.camera.url,
        timeout: config.camera.timeout,
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': 'Basic ' + Buffer.from(config.camera.user + ':' + config.camera.password).toString('base64')
        },
        data: '<?xml version="1.0" encoding="UTF-8"?>\r\n<Root></Root>\r\n'
      });

      try {
        const parsedPlates = await utils.parseXML(response.data);
        const newPlates = await this.filterNewPlates(parsedPlates);
        await Auto.insertBulk(newPlates, idPlaya);

        return {
          success: true,
          data: newPlates,
          message: 'Plates retrieved successfully'
        };
      } catch (parseError) {
        console.error("❌ Error parsing camera data:", parseError.message);
        return {
          success: false,
          data: [],
          message: 'Error parsing camera data'
        };
      }
    } catch (error) {
      console.error("❌ Error during camera request:", error.message);
      console.log("📷 Cámara no disponible, devolviendo array vacío");
      return {
        success: false,
        data: [],
        message: 'Camera not available'
      };
    }
  }

  static async filterNewPlates(plates) {
    try {
      if (!plates || plates.length === 0) return [];

      const plateNumbers = plates.map(plate => plate.plateNumber);
      const existingPlates = await Auto.findExistingPlates(plateNumbers);
      
      const newPlates = plates.filter(plate => 
        !existingPlates.has(`${plate.plateNumber}-${Auto.convertCaptureTimeToDate(plate.captureTime)}`)
      );
      
      return newPlates;
    } catch (error) {
      console.error('Error filtering plates:', error);
      return [];
    }
  }
}

module.exports = CameraService;