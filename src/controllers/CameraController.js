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
      // Obtener IP real considerando proxies
      const sourceIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress || 
                      req.ip;

      console.log("🚨 ===== NOTIFICACIÓN CÁMARA HIKVISION =====");
      console.log("📍 IP Real de Cámara:", sourceIP);
      console.log("🔧 Método:", req.method);
      console.log("🌐 URL:", req.url);
      console.log("📋 Content-Type:", req.headers['content-type']);
      console.log("🔍 Query Params:", JSON.stringify(req.query, null, 2));
      
      // Información sobre el body (imagen)
      if (req.body && Buffer.isBuffer(req.body)) {
        console.log("📸 Imagen recibida:", {
          size: `${req.body.length} bytes`,
          type: req.headers['content-type'],
          isJPEG: req.headers['content-type']?.includes('image/jpeg')
        });
      } else if (req.body) {
        console.log("📦 Body (no imagen):", typeof req.body, req.body);
      }
      
      console.log("🚨 ============================================");

      // Extraer parámetros de query (datos principales de la notificación)
      const { 
        licensePlate, 
        eventType, 
        channelID, 
        confidenceLevel, 
        dateTime, 
        lane, 
        direction, 
        country 
      } = req.query;

      // VALIDACIÓN ESTRICTA: Rechazar peticiones inválidas
      if (!licensePlate || licensePlate.trim() === '') {
        console.log("❌ RECHAZADO: Sin licensePlate");
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid notification: licensePlate is required'
        });
      }

      if (!eventType || eventType !== 'vehicleDetection') {
        console.log(`❌ RECHAZADO: eventType inválido (${eventType}), esperado: vehicleDetection`);
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid notification: eventType must be vehicleDetection'
        });
      }

      console.log(`✅ VALIDACIÓN EXITOSA: Placa=${licensePlate}, Evento=${eventType}`);

      // Procesar la detección de vehículo
      const result = await CameraService.processVehicleDetection({
        licensePlate: licensePlate.trim().toUpperCase(),
        eventType,
        channelID,
        confidenceLevel,
        dateTime,
        lane,
        direction,
        country,
        sourceIP,
        headers: req.headers,
        hasImage: req.body && Buffer.isBuffer(req.body),
        imageSize: req.body && Buffer.isBuffer(req.body) ? req.body.length : 0
      });

      if (result.success) {
        console.log("✅ VEHÍCULO REGISTRADO:", {
          id: result.data.id_auto,
          placa: result.data.placa,
          playa: result.data.id_playa,
          estado: result.data.state,
          hora: result.data.hora_entrada
        });
        
        // Emitir notificación por WebSocket si hay un auto creado
        if (result.data && global.io) {
          global.io.to(`playa-${result.data.id_playa}`).emit('vehicle-detected', {
            type: 'vehicle-entry',
            vehicle: result.data,
            timestamp: new Date().toISOString()
          });
        }

        // Respuesta exitosa para la cámara
        return res.status(config.httpCodes.OK).json({
          success: true,
          message: 'Vehicle detection processed successfully',
          data: {
            vehicleId: result.data.id_auto,
            licensePlate: result.data.placa,
            playaId: result.data.id_playa,
            timestamp: result.data.hora_entrada
          }
        });
      } else {
        console.log("⚠️ DETECCIÓN NO PROCESADA:", result.message);
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('❌ ERROR CRÍTICO procesando notificación de cámara:', error);
      
      // Respuesta de error para la cámara
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error processing vehicle detection',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = CameraController;