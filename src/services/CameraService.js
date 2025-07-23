const axios = require('axios');
const Auto = require('../models/Auto');
const Playa = require('../models/Playa');
const utils = require('../utils/xmlParser');
const config = require('../config/server');
const moment = require('moment-timezone');

class CameraService {
  static async getPlatesFromCamera(idPlaya) {
    try {
      console.log("📷 Obteniendo placas para playa:", idPlaya);
      
      // Obtener datos de la playa incluyendo configuración de cámara
      const playa = await Playa.findById(idPlaya);
      if (!playa) {
        console.log("📷 ERROR: Playa no encontrada:", idPlaya);
        return {
          success: false,
          data: [],
          message: 'Playa not found'
        };
      }

      // Verificar si la playa tiene configuración de cámara
      if (!playa.cam_url || !playa.cam_user || !playa.cam_password) {
        console.log("📷 ERROR: Playa sin configuración de cámara:", playa.nombre);
        return {
          success: false,
          data: [],
          message: 'Camera not configured for this playa'
        };
      }

      console.log("📷 Conectando a cámara de playa:", playa.nombre);

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

        console.log("📷 ✅ Placas obtenidas:", newPlates.length);
        return {
          success: true,
          data: newPlates,
          message: 'Plates retrieved successfully'
        };
      } catch (parseError) {
        console.error("📷 Error parsing camera data:", parseError.message);
        return {
          success: false,
          data: [],
          message: 'Error parsing camera data'
        };
      }
    } catch (error) {
      console.error("📷 Error during camera request:", error.message);
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

  /**
   * Procesa una detección de vehículo desde cámara Hikvision
   * Identifica la playa por IP, valida que esté abierta y crea el registro del auto
   * @param {Object} detectionData - Datos de la detección (licensePlate, sourceIP, etc.)
   * @returns {Object} - Resultado con success, data y message
   */
  static async processVehicleDetection(detectionData) {
    try {
      const { licensePlate, sourceIP } = detectionData;
      console.log("� ProcEesando:", licensePlate, "desde IP:", sourceIP);

      // Identificar la playa basándose en la IP de la cámara
      const playa = await this.findPlayaByCamera(sourceIP);
      
      if (!playa) {
        console.log("📷 ERROR: No se encontró playa para IP:", sourceIP);
        return {
          success: false,
          message: `No se encontró playa asociada a la IP: ${sourceIP}`
        };
      }

      console.log("📷 Playa encontrada:", playa.nombre);

      // Verificar si la playa está abierta
      if (playa.estado !== 'abierto') {
        console.log("📷 ERROR: Playa cerrada");
        return {
          success: false,
          message: `Playa ${playa.nombre} está cerrada`
        };
      }

      // Crear el registro del auto usando fecha/hora del sistema
      const horaEntrada = moment().tz(config.timezone).toDate();

      const autoData = {
        id_playa: playa.id_playa,
        placa: licensePlate.toUpperCase(),
        horaEntrada: horaEntrada,
        state: 1 // Estado inicial: NO TICKET
      };

      const newAuto = await Auto.create(autoData);
      console.log("📷 ✅ Auto creado:", newAuto.placa, "en playa", playa.nombre);

      return {
        success: true,
        data: newAuto,
        message: 'Vehículo registrado exitosamente'
      };

    } catch (error) {
      console.error('📷 ERROR procesando detección:', error.message);
      return {
        success: false,
        message: `Error interno: ${error.message}`
      };
    }
  }

  static async findPlayaByCamera(sourceIP) {
    try {
      console.log("� BuscEando playa por IP:", sourceIP);
      // Buscar playa por IP de cámara (incluye fallback interno)
      const playa = await Playa.findByCameraIP(sourceIP);
      return playa;
    } catch (error) {
      console.error('📷 ERROR finding playa by camera:', error);
      return null;
    }
  }


}

module.exports = CameraService;