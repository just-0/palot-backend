const axios = require('axios');
const Auto = require('../models/Auto');
const Playa = require('../models/Playa');
const utils = require('../utils/xmlParser');
const config = require('../config/server');
const moment = require('moment-timezone');

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

  static async processVehicleDetection(detectionData) {
    try {
      const { licensePlate, sourceIP, dateTime, confidenceLevel } = detectionData;

      console.log(`🚗 Procesando detección de placa: ${licensePlate}`);
      console.log(`📍 IP origen: ${sourceIP}`);

      // 1. Identificar la playa basándose en la IP de la cámara
      const playa = await this.findPlayaByCamera(sourceIP);
      if (!playa) {
        return {
          success: false,
          message: `No se encontró playa asociada a la IP: ${sourceIP}`
        };
      }

      console.log(`🏖️ Playa identificada: ${playa.nombre} (ID: ${playa.id_playa})`);

      // 2. Verificar si la playa está abierta
      if (playa.estado !== 'abierto') {
        console.log(`⚠️ Playa ${playa.nombre} está cerrada, ignorando detección`);
        return {
          success: false,
          message: `Playa ${playa.nombre} está cerrada`
        };
      }

      // 3. Crear el registro del auto - SIEMPRE usar fecha/hora del sistema
      const horaEntrada = moment().tz(config.timezone).toDate();

      const autoData = {
        id_playa: playa.id_playa,
        placa: licensePlate.toUpperCase(),
        horaEntrada: horaEntrada,
        state: 1 // Estado inicial: NO TICKET
      };

      const newAuto = await Auto.create(autoData);

      console.log(`✅ Auto creado exitosamente: ID ${newAuto.id_auto}, Placa: ${newAuto.placa}`);

      return {
        success: true,
        data: newAuto,
        message: 'Vehículo registrado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error procesando detección de vehículo:', error);
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


}

module.exports = CameraService;