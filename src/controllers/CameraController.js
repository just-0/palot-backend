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

  static async receiveVehicleDetection(req, res) {
    try {
      console.log("🚨 ===== NOTIFICACIÓN CÁMARA HIKVISION =====");
      console.log("📍 IP Origen:", req.ip || req.connection.remoteAddress);
      console.log("🔍 Query params:", JSON.stringify(req.query, null, 2));
      console.log("📋 Headers:", JSON.stringify(req.headers, null, 2));
      console.log("📦 Body:", JSON.stringify(req.body, null, 2));
      console.log("🌐 URL completa:", req.url);
      console.log("🔧 Método:", req.method);
      console.log("🚨 ============================================");

      const { licensePlate, eventType, channelID, confidenceLevel, dateTime, lane, direction, country } = req.query;

      // Validar que sea una detección de vehículo con placa
      if (!licensePlate || !eventType || eventType !== 'vehicleDetection') {
        console.log("❌ Notificación ignorada: sin placa o evento inválido");
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid notification: missing licensePlate or invalid eventType'
        });
      }

      // Procesar la detección de vehículo
      const result = await CameraService.processVehicleDetection({
        licensePlate,
        eventType,
        channelID,
        confidenceLevel,
        dateTime,
        lane,
        direction,
        country,
        sourceIP: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || req.connection.remoteAddress,
        headers: req.headers
      });

      if (result.success) {
        console.log("✅ Vehículo registrado exitosamente:", result.data);
        
        // Emitir notificación por WebSocket si hay un auto creado
        if (result.data && global.io) {
          global.io.to(`playa-${result.data.id_playa}`).emit('vehicle-detected', {
            type: 'vehicle-entry',
            vehicle: result.data,
            timestamp: new Date().toISOString()
          });
        }

        return res.status(config.httpCodes.OK).json({
          success: true,
          message: 'Vehicle detection processed successfully',
          data: result.data
        });
      } else {
        console.log("⚠️ No se pudo procesar la detección:", result.message);
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('❌ Error procesando notificación de cámara:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error processing vehicle detection'
      });
    }
  }
}

module.exports = CameraController;