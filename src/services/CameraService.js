const axios = require('axios');
const Auto = require('../models/Auto');
const Playa = require('../models/Playa');
const utils = require('../utils/xmlParser');
const config = require('../config/server');
const moment = require('moment-timezone');

class CameraService {
  static async getPlatesFromCamera(idPlaya) {
    try {
      // Obtener datos de la playa incluyendo configuración de cámara
      const playa = await Playa.findById(idPlaya);
      if (!playa) {
        return {
          success: false,
          data: [],
          message: 'Playa not found'
        };
      }

      // Verificar si la playa tiene configuración de cámara
      if (!playa.cam_url || !playa.cam_user || !playa.cam_password) {
        return {
          success: false,
          data: [],
          message: 'Camera not configured for this playa'
        };
      }

      const response = await axios({
        method: 'GET',
        url: playa.cam_url,
        timeout: config.camera.timeout || 5000,
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': 'Basic ' + Buffer.from(playa.cam_user + ':' + playa.cam_password).toString('base64')
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
        console.error("Error parsing camera data:", parseError.message);
        return {
          success: false,
          data: [],
          message: 'Error parsing camera data'
        };
      }
    } catch (error) {
      console.error("Error during camera request:", error.message);
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

  /**
   * Procesa una detección de vehículo desde cámara Hikvision
   * Identifica la playa por IP, valida que esté abierta y crea el registro del auto
   * @param {Object} detectionData - Datos de la detección (licensePlate, sourceIP, dateTime, etc.)
   * @returns {Object} - Resultado con success, data y message
   */
  static async processVehicleDetection(detectionData) {
    try {
      const { licensePlate, sourceIP, dateTime } = detectionData;

      // Identificar la playa basándose en la IP de la cámara
      const playa = await this.findPlayaByCamera(sourceIP);
      
      if (!playa) {
        return {
          success: false,
          message: `No se encontró playa asociada a la IP: ${sourceIP}`
        };
      }

      // Verificar si la playa está abierta
      if (playa.estado !== 'abierto') {
        return {
          success: false,
          message: `Playa ${playa.nombre} está cerrada`
        };
      }

      // Generar URL de la imagen basada en la IP de la cámara y timestamp
      const imageUrl = this.generatePlateImageUrl(sourceIP, dateTime);

      // Crear el registro del auto usando fecha/hora del sistema
      const horaEntrada = moment().tz(config.timezone).toDate();

      const autoData = {
        id_playa: playa.id_playa,
        placa: licensePlate.toUpperCase(),
        horaEntrada: horaEntrada,
        image: imageUrl,
        state: 1 // Estado inicial: NO TICKET
      };

      const newAuto = await Auto.create(autoData);

      return {
        success: true,
        data: newAuto,
        message: 'Vehículo registrado exitosamente'
      };

    } catch (error) {
      console.error('Error procesando detección:', error.message);
      return {
        success: false,
        message: `Error interno: ${error.message}`
      };
    }
  }

  static async findPlayaByCamera(sourceIP) {
    try {
      // Buscar playa por IP de cámara (incluye fallback interno)
      const playa = await Playa.findByCameraIP(sourceIP);
      return playa;
    } catch (error) {
      console.error('Error finding playa by camera:', error);
      return null;
    }
  }

  /**
   * Genera la URL de la imagen de la placa basada en la IP de la cámara y timestamp
   * Formato: http://IP:80/doc/ui/images/plate/YYYYMMDDHHMMSS000.jpg
   * @param {string} sourceIP - IP de la cámara
   * @param {string} dateTime - Timestamp del evento (formato ISO o similar)
   * @returns {string} - URL completa de la imagen
   */
  static generatePlateImageUrl(sourceIP, dateTime) {
    try {
      let timestamp;
      
      if (dateTime) {
        // Convertir el dateTime a formato YYYYMMDDHHMMSS000
        const date = moment(dateTime);
        if (date.isValid()) {
          timestamp = date.format('YYYYMMDDHHMMSS') + '000';
        } else {
          // Si no se puede parsear, usar timestamp actual
          timestamp = moment().format('YYYYMMDDHHMMSS') + '000';
        }
      } else {
        // Si no hay dateTime, usar timestamp actual
        timestamp = moment().format('YYYYMMDDHHMMSS') + '000';
      }

      // Construir la URL de la imagen
      const imageUrl = `http://${sourceIP}:80/doc/ui/images/plate/${timestamp}.jpg`;
      return imageUrl;
    } catch (error) {
      console.error('Error generating plate image URL:', error);
      // Fallback con timestamp actual
      const timestamp = moment().format('YYYYMMDDHHMMSS') + '000';
      return `http://${sourceIP}:80/doc/ui/images/plate/${timestamp}.jpg`;
    }
  }
}

module.exports = CameraService;