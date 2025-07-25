const axios = require("axios");
const Auto = require("../models/Auto");
const Playa = require("../models/Playa");
const utils = require("../utils/xmlParser");
const config = require("../config/server");
const moment = require("moment-timezone");

class CameraService {
  static async getPlatesFromCamera(idPlaya) {
    try {
      // Obtener datos de la playa incluyendo configuración de cámara
      const playa = await Playa.findById(idPlaya);
      if (!playa) {
        return {
          success: false,
          data: [],
          message: "Playa not found",
        };
      }

      // Verificar si la playa tiene configuración de cámara
      if (!playa.cam_url || !playa.cam_user || !playa.cam_password) {
        return {
          success: false,
          data: [],
          message: "Camera not configured for this playa",
        };
      }

      const response = await axios({
        method: "GET",
        url: playa.cam_url,
        timeout: config.camera.timeout || 5000,
        headers: {
          "Content-Type": "text/plain",
          Authorization:
            "Basic " +
            Buffer.from(playa.cam_user + ":" + playa.cam_password).toString(
              "base64"
            ),
        },
        data: '<?xml version="1.0" encoding="UTF-8"?>\r\n<Root></Root>\r\n',
      });

      try {
        const parsedPlates = await utils.parseXML(response.data);
        const newPlates = await this.filterNewPlates(parsedPlates);
        await Auto.insertBulk(newPlates, idPlaya);

        return {
          success: true,
          data: newPlates,
          message: "Plates retrieved successfully",
        };
      } catch (parseError) {
        console.error("Error parsing camera data:", parseError.message);
        return {
          success: false,
          data: [],
          message: "Error parsing camera data",
        };
      }
    } catch (error) {
      console.error("Error during camera request:", error.message);
      return {
        success: false,
        data: [],
        message: "Camera not available",
      };
    }
  }

  static async filterNewPlates(plates) {
    try {
      if (!plates || plates.length === 0) return [];

      const plateNumbers = plates.map((plate) => plate.plateNumber);
      const existingPlates = await Auto.findExistingPlates(plateNumbers);

      const newPlates = plates.filter(
        (plate) =>
          !existingPlates.has(
            `${plate.plateNumber}-${Auto.convertCaptureTimeToDate(
              plate.captureTime
            )}`
          )
      );

      return newPlates;
    } catch (error) {
      console.error("Error filtering plates:", error);
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
          message: `No se encontró playa asociada a la IP: ${sourceIP}`,
        };
      }

      // Verificar si la playa está abierta
      if (playa.estado !== "abierto") {
        return {
          success: false,
          message: `Playa ${playa.nombre} está cerrada`,
        };
      }

      // Generar URL de la imagen consultando la cámara para obtener el picName real
      const imageUrl = await this.generatePlateImageUrl(
        sourceIP,
        dateTime,
        licensePlate
      );

      // Usar la fecha/hora de la cámara, no del sistema
      let horaEntrada;
      if (dateTime) {
        // Parsear el formato específico de la cámara
        horaEntrada = this.parseCameraDateTimeToDate(dateTime);
      } else {
        // Fallback al sistema solo si no hay dateTime de la cámara
        horaEntrada = moment().tz(config.timezone).toDate();
      }

      const autoData = {
        id_playa: playa.id_playa,
        placa: licensePlate.toUpperCase(),
        horaEntrada: horaEntrada,
        image: imageUrl,
        state: 1, // Estado inicial: NO TICKET
      };

      const newAuto = await Auto.create(autoData);

      return {
        success: true,
        data: newAuto,
        message: "Vehículo registrado exitosamente",
      };
    } catch (error) {
      console.error("Error procesando detección:", error.message);
      return {
        success: false,
        message: `Error interno: ${error.message}`,
      };
    }
  }

  static async findPlayaByCamera(sourceIP) {
    try {
      // Buscar playa por IP de cámara (incluye fallback interno)
      const playa = await Playa.findByCameraIP(sourceIP);
      return playa;
    } catch (error) {
      console.error("Error finding playa by camera:", error);
      return null;
    }
  }

  /**
   * Genera la URL de la imagen consultando el endpoint de la cámara de la playa
   * Obtiene el picName real desde /ISAPI/Traffic/channels/1/vehicleDetect/plates
   * @param {string} sourceIP - IP de la cámara
   * @param {string} dateTime - Timestamp del evento (formato de cámara: 20250725T140730-500)
   * @param {string} licensePlate - Placa detectada para validación
   * @returns {string} - URL completa de la imagen
   */
  static async generatePlateImageUrl(sourceIP, dateTime, licensePlate) {
    try {
      // Obtener configuración de la playa por IP de cámara
      const playa = await this.findPlayaByCamera(sourceIP);
      if (!playa) {
        console.log("⚠️ No se encontró playa para IP de cámara:", sourceIP);
        return `http://${sourceIP}:80/doc/ui/images/plate/imagen_no_disponible.jpg`;
      }

      if (!playa.cam_url || !playa.cam_user || !playa.cam_password) {
        console.log(
          "⚠️ Playa sin configuración completa de cámara:",
          playa.nombre
        );
        return `http://${sourceIP}:80/doc/ui/images/plate/imagen_no_disponible.jpg`;
      }

      // Construir XML de solicitud - usar tiempo desde hace 2 horas para asegurar que incluya la detección
      const baseTime = moment()
        .subtract(2, "hours")
        .format("YYYY-MM-DD[T]HH:mm:ss-05:00");
      const requestXML = `<AfterTime version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
<picTime>${baseTime}</picTime>
</AfterTime>`;

      // Construir URL del endpoint de la cámara usando cam_url de la playa
      let cameraBaseUrl = playa.cam_url;
      // Asegurar que no termine en /
      if (cameraBaseUrl.endsWith("/")) {
        cameraBaseUrl = cameraBaseUrl.slice(0, -1);
      }
      const cameraUrl = `${cameraBaseUrl}/ISAPI/Traffic/channels/1/vehicleDetect/plates`;

      const authHeader =
        "Basic " +
        Buffer.from(playa.cam_user + ":" + playa.cam_password).toString(
          "base64"
        );

      console.log("📡 CONSULTANDO CÁMARA DE LA PLAYA:");
      console.log("   🏢 Playa:", playa.nombre);
      console.log("   📍 IP Cámara:", sourceIP);
      console.log("   🌐 URL Cámara:", cameraUrl);
      console.log("   👤 Usuario:", playa.cam_user);
      console.log("   ⏰ BaseTime:", baseTime);

      const response = await axios({
        method: "POST",
        url: cameraUrl,
        timeout: 8000,
        headers: {
          "Content-Type": "application/xml",
          Authorization: authHeader,
        },
        data: requestXML,
      });

      // Parsear respuesta XML
      const xml2js = require("xml2js");
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: false,
        trim: true,
      });

      const parsedXML = await parser.parseStringPromise(response.data);
      const plates = parsedXML.Plates?.Plate;

      if (!plates) {
        console.log("⚠️ No se encontraron placas en la respuesta de la cámara");
        return `http://${sourceIP}:80/doc/ui/images/plate/sin_placas.jpg`;
      }

      // Convertir a array si es un solo elemento
      const plateArray = Array.isArray(plates) ? plates : [plates];

      console.log(`📋 Se encontraron ${plateArray.length} placas en la cámara`);

      // Buscar la placa específica que coincida con la detectada
      let targetPlate = null;

      if (licensePlate) {
        targetPlate = plateArray.find(
          (plate) =>
            plate.plateNumber &&
            plate.plateNumber.toUpperCase() === licensePlate.toUpperCase()
        );
      }

      // Si no se encuentra por placa exacta, usar el último elemento (más reciente)
      if (!targetPlate && plateArray.length > 0) {
        targetPlate = plateArray[plateArray.length - 1];
        console.log("🔄 Usando última placa detectada como fallback");
      }

      if (targetPlate && targetPlate.picName) {
        const imageUrl = `http://${sourceIP}:80/doc/ui/images/plate/${targetPlate.picName}.jpg`;

        console.log("✅ PicName obtenido de la cámara:", targetPlate.picName);
        console.log("✅ URL final:", imageUrl);

        return imageUrl;
      } else {
        console.log("⚠️ No se encontró picName válido en la respuesta");
        return `http://${sourceIP}:80/doc/ui/images/plate/picname_no_encontrado.jpg`;
      }
    } catch (error) {
      console.error(
        "❌ Error consultando cámara para obtener picName:",
        error.message
      );
      return `http://${sourceIP}:80/doc/ui/images/plate/error_consulta.jpg`;
    }
  }

  /**
   * Parsea el formato de fecha/hora específico de la cámara y lo convierte a Date
   * Entrada: 20250724T175932-500
   * Salida: Date object
   * @param {string} cameraDateTime - Formato de cámara
   * @returns {Date} - Objeto Date
   */
  static parseCameraDateTimeToDate(cameraDateTime) {
    try {
      // Formato de entrada: 20250724T175932-500
      // Extraer partes: YYYYMMDD T HHMMSS -500
      const match = cameraDateTime.match(/^(\d{8})T(\d{6})/);

      if (match) {
        const datePart = match[1]; // 20250724
        const timePart = match[2]; // 175932

        // Convertir a formato ISO: YYYY-MM-DDTHH:mm:ss
        const year = datePart.substring(0, 4);
        const month = datePart.substring(4, 6);
        const day = datePart.substring(6, 8);
        const hour = timePart.substring(0, 2);
        const minute = timePart.substring(2, 4);
        const second = timePart.substring(4, 6);

        const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
        const date = moment(isoString, "YYYY-MM-DDTHH:mm:ss", true);

        if (date.isValid()) {
          return date.toDate();
        }
      }

      // Fallback: intentar parsear como fecha normal
      const date = moment(
        cameraDateTime,
        ["YYYYMMDD[T]HHmmss", "YYYY-MM-DD[T]HH:mm:ss", moment.ISO_8601],
        true
      );
      if (date.isValid()) {
        return date.toDate();
      } else {
        // Último fallback: usar fecha actual del sistema
        return moment().tz(config.timezone).toDate();
      }
    } catch (error) {
      console.error("Error parsing camera dateTime to Date:", error);
      return moment().tz(config.timezone).toDate();
    }
  }
}

module.exports = CameraService;
