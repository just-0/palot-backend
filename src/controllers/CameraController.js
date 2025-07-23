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
      console.log("📦 Query Params:", JSON.stringify(req.query, null, 2));
      console.log("🚨 ============================================");

      let eventType, plateNumber, channelID, dateTime, eventState;
      let dataSource = "unknown";

      // DETECTAR FORMATO: Query Params vs XML
      if (req.query && Object.keys(req.query).length > 0 && req.query.licensePlate) {
        // FORMATO 1: Datos en Query Params (detección de placas real)
        console.log("📋 FORMATO: Query Params (detección de placas)");

        eventType = req.query.eventType;
        plateNumber = req.query.licensePlate || req.query.plateNumber;
        channelID = req.query.channelID;
        dateTime = req.query.dateTime;
        eventState = "active"; // Asumir activo para query params
        dataSource = "query";

        console.log("📊 Datos extraídos de Query Params:", {
          eventType,
          plateNumber,
          channelID,
          dateTime,
          eventState,
          country: req.query.country,
          lane: req.query.lane,
          direction: req.query.direction,
          confidenceLevel: req.query.confidenceLevel,
        });
      } else if (
        req.headers["content-type"]?.includes("application/xml") ||
        req.headers["content-type"]?.includes("text/xml")
      ) {
        // FORMATO 2: Datos en XML (eventos de movimiento, etc.)
        console.log("📋 FORMATO: XML Body");

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
          console.log(
            "❌ RECHAZADO: No se encontró AlarmEvent o EventNotificationAlert en el XML"
          );
          return res.status(config.httpCodes.BAD_REQUEST).json({
            success: false,
            message: "Invalid XML: AlarmEvent or EventNotificationAlert not found",
          });
        }

        eventType = alarmEvent.eventType;
        plateNumber =
          alarmEvent.plateNumber ||
          alarmEvent.licensePlate ||
          alarmEvent.plateNo;
        channelID = alarmEvent.channelID;
        dateTime = alarmEvent.dateTime;
        eventState = alarmEvent.eventState;
        dataSource = "xml";

        console.log("📊 Datos extraídos del XML:", {
          eventType,
          plateNumber,
          channelID,
          dateTime,
          eventState,
          xmlType: parsedXML.AlarmEvent ? "AlarmEvent" : "EventNotificationAlert",
        });
      } else {
        // FORMATO DESCONOCIDO
        console.log("❌ RECHAZADO: Formato no reconocido");
        console.log("   Content-Type:", req.headers["content-type"]);
        console.log("   Query params:", Object.keys(req.query).length);

        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid format: expected query params with licensePlate or XML",
        });
      }

      // FILTRO PRINCIPAL: Solo procesar eventos de detección de placas
      const validVehicleEvents = [
        "vehicleDetection",
        "ANPR", // Automatic Number Plate Recognition
        "plateRecognition",
        "licensePlateRecognition",
      ];

      if (!eventType || !validVehicleEvents.includes(eventType)) {
        console.log(
          `🚫 IGNORADO: Evento no es de detección de placas (${eventType})`
        );
        console.log(`   ℹ️  Eventos válidos: ${validVehicleEvents.join(", ")}`);

        // Respuesta exitosa para la cámara (para que no reintente)
        const responseXML = `<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus>
  <requestURL>${req.url}</requestURL>
  <statusCode>1</statusCode>
  <statusString>OK</statusString>
  <subStatusCode>Event ignored - not vehicle detection</subStatusCode>
</ResponseStatus>`;

        res.set("Content-Type", "application/xml");
        return res.status(config.httpCodes.OK).send(responseXML);
      }

      // VALIDACIÓN ESTRICTA: Solo validar placa para eventos de detección válidos
      if (!plateNumber || plateNumber.trim() === "") {
        console.log(
          `❌ RECHAZADO: Sin plateNumber para evento de detección de placas (${dataSource})`
        );

        const errorXML = `<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus>
  <requestURL>${req.url}</requestURL>
  <statusCode>2</statusCode>
  <statusString>ERROR</statusString>
  <subStatusCode>plateNumber is required for vehicle detection events</subStatusCode>
</ResponseStatus>`;

        res.set("Content-Type", "application/xml");
        return res.status(config.httpCodes.BAD_REQUEST).send(errorXML);
      }

      // Solo procesar eventos activos (para XML)
      if (dataSource === "xml" && eventState && eventState !== "active") {
        console.log(`❌ RECHAZADO: eventState no es active (${eventState})`);

        const errorXML = `<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus>
  <requestURL>${req.url}</requestURL>
  <statusCode>2</statusCode>
  <statusString>ERROR</statusString>
  <subStatusCode>eventState must be active</subStatusCode>
</ResponseStatus>`;

        res.set("Content-Type", "application/xml");
        return res.status(config.httpCodes.BAD_REQUEST).send(errorXML);
      }

      console.log(
        `✅ VALIDACIÓN EXITOSA: Placa=${plateNumber}, Evento=${eventType}, Fuente=${dataSource}`
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
        dataSource,
        queryData: dataSource === "query" ? req.query : null,
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
          global.io.to(`playa-${result.data.id_playa}`).emit("vehicle-detected", {
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