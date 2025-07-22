const CameraService = require("../services/CameraService");
const config = require("../config/server");
const xml2js = require("xml2js");

class CameraController {
  static async getPlatesFromCamera(req, res) {
    try {
      const idPlaya = req.query.id_playa;
      console.log("📷 PLACAS CAMARA - Playa ID:", idPlaya);

      const result = await CameraService.getPlatesFromCamera(idPlaya);

      res.status(config.httpCodes.OK).json(result.data);
    } catch (error) {
      console.error("Camera controller error:", error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async receiveVehicleDetection(req, res) {
    try {
      // Obtener IP real considerando proxies
      const sourceIP =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.headers["x-real-ip"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip;

      console.log("🚨 ===== NOTIFICACIÓN CÁMARA HIKVISION =====");
      console.log("📍 IP Real de Cámara:", sourceIP);
      console.log("🔧 Método:", req.method);
      console.log("🌐 URL:", req.url);
      console.log("📋 Content-Type:", req.headers["content-type"]);
      console.log("� Body  raw:", req.body);
      console.log("📦 Body type:", typeof req.body);
      console.log("🚨 ============================================");

      // Validar que el contenido sea XML
      if (
        !req.headers["content-type"]?.includes("application/xml") &&
        !req.headers["content-type"]?.includes("text/xml")
      ) {
        console.log("❌ RECHAZADO: Content-Type no es XML");
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid content type: expected application/xml or text/xml",
        });
      }

      // Validar que haya contenido en el body
      if (!req.body || req.body.trim() === "") {
        console.log("❌ RECHAZADO: Body XML vacío");
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid notification: XML body is required",
        });
      }

      console.log("📄 XML recibido:", req.body);

      // Parsear el XML
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: false,
        trim: true,
      });

      let parsedXML;
      try {
        parsedXML = await parser.parseStringPromise(req.body);
        console.log(
          "✅ XML parseado exitosamente:",
          JSON.stringify(parsedXML, null, 2)
        );
      } catch (xmlError) {
        console.log("❌ ERROR parseando XML:", xmlError.message);
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid XML format",
        });
      }

      // Extraer datos del XML parseado
      const alarmEvent =
        parsedXML.AlarmEvent || parsedXML.EventNotificationAlert;
      if (!alarmEvent) {
        console.log("❌ RECHAZADO: No se encontró AlarmEvent en el XML");
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid XML: AlarmEvent not found",
        });
      }

      const eventType = alarmEvent.eventType;
      const plateNumber = alarmEvent.plateNumber || alarmEvent.licensePlate;
      const channelID = alarmEvent.channelID;
      const dateTime = alarmEvent.dateTime;
      const eventState = alarmEvent.eventState;

      console.log("📊 Datos extraídos del XML:", {
        eventType,
        plateNumber,
        channelID,
        dateTime,
        eventState,
      });

      // VALIDACIÓN ESTRICTA: Rechazar peticiones inválidas
      if (!plateNumber || plateNumber.trim() === "") {
        console.log("❌ RECHAZADO: Sin plateNumber en XML");
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid notification: plateNumber is required in XML",
        });
      }

      if (!eventType || eventType !== "vehicleDetection") {
        console.log(
          `❌ RECHAZADO: eventType inválido (${eventType}), esperado: vehicleDetection`
        );
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid notification: eventType must be vehicleDetection",
        });
      }

      // Solo procesar eventos activos
      if (eventState && eventState !== "active") {
        console.log(`❌ RECHAZADO: eventState no es active (${eventState})`);
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid notification: eventState must be active",
        });
      }

      console.log(
        `✅ VALIDACIÓN EXITOSA: Placa=${plateNumber}, Evento=${eventType}, Estado=${eventState}`
      );

      // Procesar la detección de vehículo
      const result = await CameraService.processVehicleDetection({
        licensePlate: plateNumber.trim().toUpperCase(),
        eventType,
        channelID,
        dateTime,
        eventState,
        sourceIP,
        headers: req.headers,
        xmlData: alarmEvent,
      });

      if (result.success) {
        console.log("✅ VEHÍCULO REGISTRADO:", {
          id: result.data.id_auto,
          placa: result.data.placa,
          playa: result.data.id_playa,
          estado: result.data.state,
          hora: result.data.hora_entrada,
        });

        // Emitir notificación por WebSocket si hay un auto creado
        if (result.data && global.io) {
          global.io
            .to(`playa-${result.data.id_playa}`)
            .emit("vehicle-detected", {
              type: "vehicle-entry",
              vehicle: result.data,
              timestamp: new Date().toISOString(),
            });
        }

        // Respuesta exitosa para la cámara (XML response)
        const responseXML = `<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus>
  <requestURL>${req.url}</requestURL>
  <statusCode>1</statusCode>
  <statusString>OK</statusString>
  <subStatusCode>ok</subStatusCode>
</ResponseStatus>`;

        res.set("Content-Type", "application/xml");
        return res.status(config.httpCodes.OK).send(responseXML);
      } else {
        console.log("⚠️ DETECCIÓN NO PROCESADA:", result.message);

        // Respuesta de error en XML
        const errorXML = `<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus>
  <requestURL>${req.url}</requestURL>
  <statusCode>2</statusCode>
  <statusString>ERROR</statusString>
  <subStatusCode>${result.message}</subStatusCode>
</ResponseStatus>`;

        res.set("Content-Type", "application/xml");
        return res.status(config.httpCodes.BAD_REQUEST).send(errorXML);
      }
    } catch (error) {
      console.error(
        "❌ ERROR CRÍTICO procesando notificación de cámara:",
        error
      );

      // Respuesta de error para la cámara en XML
      const errorXML = `<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus>
  <requestURL>${req.url || "/camera/vehicle-detection"}</requestURL>
  <statusCode>3</statusCode>
  <statusString>INTERNAL_ERROR</statusString>
  <subStatusCode>Internal server error</subStatusCode>
</ResponseStatus>`;

      res.set("Content-Type", "application/xml");
      res.status(config.httpCodes.INTERNAL_ERROR).send(errorXML);
    }
  }
}

module.exports = CameraController;
