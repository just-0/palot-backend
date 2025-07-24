const CameraService = require("../services/CameraService");
const config = require("../config/server");
const xml2js = require("xml2js");

class CameraController {
  static async getPlatesFromCamera(req, res) {
    try {
      const idPlaya = req.query.id_playa;
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

  /**
   * Procesa notificaciones de cámaras Hikvision para detección de placas
   * Soporta dos formatos:
   * 1. Query params (detección real de placas): ?licensePlate=ABC123&eventType=vehicleDetection
   * 2. XML body (eventos de movimiento): <EventNotificationAlert><eventType>VMD</eventType>...
   * 
   * Solo procesa eventos de detección de placas, ignora eventos de movimiento (VMD)
   * Crea automáticamente registros de Auto con estado 1 (NO TICKET)
   */
  static async receiveVehicleDetection(req, res) {
    try {
      const sourceIP =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.headers["x-real-ip"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip;

      let eventType, plateNumber, channelID, dateTime, eventState;
      let dataSource = "unknown";

      // Detectar formato de datos: Query Params (detección real) vs XML (eventos varios)
      if (req.query && Object.keys(req.query).length > 0 && req.query.licensePlate) {
        // Formato 1: Datos en Query Params - Detección real de placas
        eventType = req.query.eventType;
        plateNumber = req.query.licensePlate || req.query.plateNumber;
        channelID = req.query.channelID;
        dateTime = req.query.dateTime;
        eventState = "active";
        dataSource = "query";

      } else if (
        req.headers["content-type"]?.includes("application/xml") ||
        req.headers["content-type"]?.includes("text/xml")
      ) {
        // Formato 2: Datos en XML - Eventos varios (movimiento, etc.)
        if (!req.body || req.body.trim() === "") {
          return res.status(config.httpCodes.BAD_REQUEST).json({
            success: false,
            message: "Invalid notification: XML body is required",
          });
        }

        // Parsear XML
        const parser = new xml2js.Parser({
          explicitArray: false,
          ignoreAttrs: false,
          trim: true,
        });

        let parsedXML;
        try {
          parsedXML = await parser.parseStringPromise(req.body);
        } catch (xmlError) {
          return res.status(config.httpCodes.BAD_REQUEST).json({
            success: false,
            message: "Invalid XML format",
          });
        }

        // Extraer datos del XML
        const alarmEvent =
          parsedXML.AlarmEvent || parsedXML.EventNotificationAlert;
        if (!alarmEvent) {
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

      } else {
        // Formato no reconocido
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid format: expected query params with licensePlate or XML",
        });
      }

      // Filtrar solo eventos de detección de placas
      const validVehicleEvents = [
        "vehicleDetection",
        "ANPR", // Automatic Number Plate Recognition
        "plateRecognition",
        "licensePlateRecognition",
      ];

      if (!eventType || !validVehicleEvents.includes(eventType)) {
        // Ignorar eventos que no son de detección de placas (ej: VMD)
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

      // Validar que tenga placa para eventos de detección
      if (!plateNumber || plateNumber.trim() === "") {
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

      // Para XML, validar que el evento esté activo
      if (dataSource === "xml" && eventState && eventState !== "active") {
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
        // Emitir notificación WebSocket para actualización en tiempo real
        if (result.data && global.io) {
          global.io.to(`playa-${result.data.id_playa}`).emit("vehicle-detected", {
            type: "vehicle-entry",
            vehicle: result.data,
            timestamp: new Date().toISOString(),
          });
        }

        // Respuesta exitosa en formato XML para la cámara
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
        // Respuesta de error en formato XML
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
      console.error("Error procesando notificación de cámara:", error);

      // Respuesta de error crítico en formato XML
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