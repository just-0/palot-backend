const Auto = require("../models/Auto");
const Moto = require("../models/Moto");
const Boleta = require("../models/Boleta");
const Ticket = require("../models/Ticket");
const Factura = require("../models/Factura");
const Cliente = require("../models/Cliente");
const Playa = require("../models/Playa");
const moment = require("moment-timezone");
const config = require("../config/server");

class VehicleService {
  static getTodayDateRange() {
    const todayStart = moment()
      .tz(config.timezone)
      .startOf("day")
      .format(process.env.DATE_FORMAT || "YYYY-MM-DD HH:mm:ss");

    const todayEnd = moment()
      .tz(config.timezone)
      .endOf("day")
      .format(process.env.DATE_FORMAT || "YYYY-MM-DD HH:mm:ss");

    return { todayStart, todayEnd };
  }

  static async getAutos(idPlaya) {
    try {
      const { todayStart, todayEnd } = this.getTodayDateRange();
      const autos = await Auto.getByPlayaAndDate(idPlaya, todayStart, todayEnd);

      return {
        success: true,
        data: autos,
      };
    } catch (error) {
      console.error("Error getting autos:", error);
      return {
        success: false,
        message: "Error retrieving autos",
      };
    }
  }

  static async getMotos(idPlaya) {
    try {
      const { todayStart, todayEnd } = this.getTodayDateRange();
      const motos = await Moto.getByPlayaAndDate(idPlaya, todayStart, todayEnd);

      return {
        success: true,
        data: motos,
      };
    } catch (error) {
      console.error("Error getting motos:", error);
      return {
        success: false,
        message: "Error retrieving motos",
      };
    }
  }

  static async updateAutoState(id, state) {
    try {
      const updated = await Auto.updateState(id, state);

      if (!updated) {
        return {
          success: false,
          message: "Auto not found",
        };
      }

      return {
        success: true,
        message: "Auto state updated successfully",
      };
    } catch (error) {
      console.error("Error updating auto state:", error);
      return {
        success: false,
        message: "Error updating auto state",
      };
    }
  }

  static async updateMotoState(id, state) {
    try {
      const updated = await Moto.updateState(id, state);

      if (!updated) {
        return {
          success: false,
          message: "Moto not found",
        };
      }

      return {
        success: true,
        message: "Moto state updated successfully",
      };
    } catch (error) {
      console.error("Error updating moto state:", error);
      return {
        success: false,
        message: "Error updating moto state",
      };
    }
  }

  static async processAutoPayment(data) {
    try {
      const fechaSalida = moment(data.horaSalida)
        .tz(config.timezone)
        .format(process.env.DATE_FORMAT || "YYYY-MM-DD HH:mm:ss");

      // Obtener información del auto para conseguir el id_playa
      const auto = await Auto.findById(data.id);
      if (!auto) {
        return {
          success: false,
          message: "Auto not found",
        };
      }

      // Obtener información de la playa para verificar si requiere facturación
      const playa = await Playa.getById(auto.id_playa);

      let documentId;
      let documentType;

      if (playa && playa.facturacion) {
        // Si la playa requiere facturación, crear boleta
        // Verificar si existe un cliente específico (opcional)
        const cliente = await Cliente.getByAutoId(data.id);
        const clienteId = cliente ? cliente.id_cliente : null;

        documentId = await Boleta.create(
          data.id,
          null,
          clienteId,
          data.Monto,
          fechaSalida
        );
        documentType = "boleta";
      } else {
        // Si no requiere facturación, crear ticket
        documentId = await Ticket.create(
          data.id,
          null,
          null,
          data.Monto,
          fechaSalida
        );
        documentType = "ticket";
      }

      // Actualizar auto
      await Auto.updateExitTime(data.id, fechaSalida, data.state);

      return {
        success: true,
        data: {
          documentId,
          documentType,
          requiresInvoicing: playa?.facturacion || false,
        },
        message: "Payment processed successfully",
      };
    } catch (error) {
      console.error("Error processing auto payment:", error);
      return {
        success: false,
        message: "Error processing payment",
      };
    }
  }

  static async processMotoPayment(data) {
    try {
      const fechaSalida = moment(data.horaSalida)
        .tz(config.timezone)
        .format(process.env.DATE_FORMAT || "YYYY-MM-DD HH:mm:ss");

      // Obtener información de la moto para conseguir el id_playa
      const moto = await Moto.findById(data.id);
      if (!moto) {
        return {
          success: false,
          message: "Moto not found",
        };
      }

      // Obtener información de la playa para verificar si requiere facturación
      const playa = await Playa.getById(moto.id_playa);

      let documentId;
      let documentType;

      if (playa && playa.facturacion) {
        // Si la playa requiere facturación, crear boleta
        // Verificar si existe un cliente específico (opcional)
        const cliente = await Cliente.getByMotoId(data.id);
        const clienteId = cliente ? cliente.id_cliente : null;

        documentId = await Boleta.create(
          null,
          data.id,
          clienteId,
          data.Monto,
          fechaSalida
        );
        documentType = "boleta";
      } else {
        // Si no requiere facturación, crear ticket
        documentId = await Ticket.create(
          null,
          data.id,
          null,
          data.Monto,
          fechaSalida
        );
        documentType = "ticket";
      }

      // Actualizar moto
      const updated = await Moto.updateExitTime(
        data.id,
        fechaSalida,
        data.state
      );

      if (!updated) {
        return {
          success: false,
          message: "Moto not found",
        };
      }

      return {
        success: true,
        data: {
          documentId,
          documentType,
          requiresInvoicing: playa?.facturacion || false,
          id_moto: data.id,
        },
        message: "Moto payment processed successfully",
      };
    } catch (error) {
      console.error("Error processing moto payment:", error);
      return {
        success: false,
        message: "Error processing moto payment",
      };
    }
  }

  static async createManualAuto(data) {
    try {
      const newAuto = await Auto.create(data);

      return {
        success: true,
        data: newAuto,
        message: "Manual auto created successfully",
      };
    } catch (error) {
      console.error("Error creating manual auto:", error);
      return {
        success: false,
        message: "Error creating manual auto",
      };
    }
  }

  static async createManualMoto(data) {
    try {
      const newMoto = await Moto.create(data);

      return {
        success: true,
        data: newMoto,
        message: "Manual moto created successfully",
      };
    } catch (error) {
      console.error("Error creating manual moto:", error);
      return {
        success: false,
        message: "Error creating manual moto",
      };
    }
  }

  static async getBoletas(idPlaya) {
    try {
      const { todayStart, todayEnd } = this.getTodayDateRange();
      const boletas = await Boleta.getByPlayaAndDate(
        idPlaya,
        todayStart,
        todayEnd
      );

      return {
        success: true,
        data: boletas,
      };
    } catch (error) {
      console.error("Error getting boletas:", error);
      return {
        success: false,
        message: "Error retrieving boletas",
      };
    }
  }

  static async getTickets(idPlaya) {
    try {
      const { todayStart, todayEnd } = this.getTodayDateRange();
      const tickets = await Ticket.getByPlayaAndDate(
        idPlaya,
        todayStart,
        todayEnd
      );

      return {
        success: true,
        data: tickets,
      };
    } catch (error) {
      console.error("Error getting tickets:", error);
      return {
        success: false,
        message: "Error retrieving tickets",
      };
    }
  }
}

module.exports = VehicleService;
