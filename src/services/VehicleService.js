const Auto = require('../models/Auto');
const Moto = require('../models/Moto');
const Boleta = require('../models/Boleta');
const moment = require('moment-timezone');
const config = require('../config/server');

class VehicleService {
  static getTodayDateRange() {
    const todayStart = moment()
      .tz(config.timezone)
      .startOf('day')
      .format(process.env.DATE_FORMAT || 'YYYY-MM-DD HH:mm:ss');
    
    const todayEnd = moment()
      .tz(config.timezone)
      .endOf('day')
      .format(process.env.DATE_FORMAT || 'YYYY-MM-DD HH:mm:ss');

    return { todayStart, todayEnd };
  }

  static async getAutos(idPlaya) {
    try {
      const { todayStart, todayEnd } = this.getTodayDateRange();
      const autos = await Auto.getByPlayaAndDate(idPlaya, todayStart, todayEnd);
      
      return {
        success: true,
        data: autos
      };
    } catch (error) {
      console.error('Error getting autos:', error);
      return {
        success: false,
        message: 'Error retrieving autos'
      };
    }
  }

  static async getMotos(idPlaya) {
    try {
      const { todayStart, todayEnd } = this.getTodayDateRange();
      const motos = await Moto.getByPlayaAndDate(idPlaya, todayStart, todayEnd);
      
      return {
        success: true,
        data: motos
      };
    } catch (error) {
      console.error('Error getting motos:', error);
      return {
        success: false,
        message: 'Error retrieving motos'
      };
    }
  }

  static async updateAutoState(id, state) {
    try {
      const updated = await Auto.updateState(id, state);
      
      if (!updated) {
        return {
          success: false,
          message: 'Auto not found'
        };
      }

      return {
        success: true,
        message: 'Auto state updated successfully'
      };
    } catch (error) {
      console.error('Error updating auto state:', error);
      return {
        success: false,
        message: 'Error updating auto state'
      };
    }
  }

  static async updateMotoState(id, state) {
    try {
      const updated = await Moto.updateState(id, state);
      
      if (!updated) {
        return {
          success: false,
          message: 'Moto not found'
        };
      }

      return {
        success: true,
        message: 'Moto state updated successfully'
      };
    } catch (error) {
      console.error('Error updating moto state:', error);
      return {
        success: false,
        message: 'Error updating moto state'
      };
    }
  }

  static async processAutoPayment(data) {
    try {
      const fechaSalida = moment(data.horaSalida)
        .tz(config.timezone)
        .format(process.env.DATE_FORMAT || "YYYY-MM-DD HH:mm:ss");

      // Crear boleta
      const boletaId = await Boleta.create(data.id, data.Monto, fechaSalida);
      
      // Actualizar auto
      await Auto.updateExitTime(data.id, fechaSalida, data.state);

      return {
        success: true,
        data: { boletaId },
        message: 'Payment processed successfully'
      };
    } catch (error) {
      console.error('Error processing auto payment:', error);
      return {
        success: false,
        message: 'Error processing payment'
      };
    }
  }

  static async processMotoPayment(data) {
    try {
      const fechaSalida = moment(data.horaSalida)
        .tz(config.timezone)
        .format(process.env.DATE_FORMAT || "YYYY-MM-DD HH:mm:ss");

      // Solo actualizar moto (no genera boleta según esquema actual)
      const updated = await Moto.updateExitTime(data.id, fechaSalida, data.state);

      if (!updated) {
        return {
          success: false,
          message: 'Moto not found'
        };
      }

      return {
        success: true,
        data: { id_moto: data.id },
        message: 'Moto payment processed successfully'
      };
    } catch (error) {
      console.error('Error processing moto payment:', error);
      return {
        success: false,
        message: 'Error processing moto payment'
      };
    }
  }

  static async createManualAuto(data) {
    try {
      const newAuto = await Auto.create(data);
      
      return {
        success: true,
        data: newAuto,
        message: 'Manual auto created successfully'
      };
    } catch (error) {
      console.error('Error creating manual auto:', error);
      return {
        success: false,
        message: 'Error creating manual auto'
      };
    }
  }

  static async createManualMoto(data) {
    try {
      const newMoto = await Moto.create(data);
      
      return {
        success: true,
        data: newMoto,
        message: 'Manual moto created successfully'
      };
    } catch (error) {
      console.error('Error creating manual moto:', error);
      return {
        success: false,
        message: 'Error creating manual moto'
      };
    }
  }

  static async getBoletas(idPlaya) {
    try {
      const { todayStart, todayEnd } = this.getTodayDateRange();
      const boletas = await Boleta.getByPlayaAndDate(idPlaya, todayStart, todayEnd);
      
      return {
        success: true,
        data: boletas
      };
    } catch (error) {
      console.error('Error getting boletas:', error);
      return {
        success: false,
        message: 'Error retrieving boletas'
      };
    }
  }
}

module.exports = VehicleService;