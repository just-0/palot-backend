const VehicleService = require('../services/VehicleService');
const config = require('../config/server');

class VehicleController {
  static async getAutos(req, res) {
    try {
      const idPlaya = req.query.idPlaya;
      const result = await VehicleService.getAutos(idPlaya);

      if (result.success) {
        res.status(config.httpCodes.OK).json(result.data);
      } else {
        res.status(config.httpCodes.INTERNAL_ERROR).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Get autos controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getMotos(req, res) {
    try {
      const idPlaya = req.query.idPlaya;
      const result = await VehicleService.getMotos(idPlaya);

      if (result.success) {
        res.status(config.httpCodes.OK).json(result.data);
      } else {
        res.status(config.httpCodes.INTERNAL_ERROR).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Get motos controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async updateAutoState(req, res) {
    try {
      const id = req.params.id_auto;
      const state = req.body.state || req.query.state;
      
      const result = await VehicleService.updateAutoState(id, state);

      if (result.success) {
        res.status(config.httpCodes.OK).json(result);
      } else {
        const statusCode = result.message.includes('not found') ? 
          config.httpCodes.NOT_FOUND : config.httpCodes.INTERNAL_ERROR;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('Update auto state controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async updateMotoState(req, res) {
    try {
      const id = req.params.id_moto;
      const state = req.body.state || req.query.state;
      
      const result = await VehicleService.updateMotoState(id, state);

      if (result.success) {
        res.status(config.httpCodes.OK).json(result);
      } else {
        const statusCode = result.message.includes('not found') ? 
          config.httpCodes.NOT_FOUND : config.httpCodes.INTERNAL_ERROR;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('Update moto state controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async processAutoPayment(req, res) {
    try {
      const result = await VehicleService.processAutoPayment(req.body);

      if (result.success) {
        res.status(config.httpCodes.OK).json(result.data);
      } else {
        res.status(config.httpCodes.INTERNAL_ERROR).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Process auto payment controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async processMotoPayment(req, res) {
    try {
      const result = await VehicleService.processMotoPayment(req.body);

      if (result.success) {
        res.status(config.httpCodes.OK).json(result.data);
      } else {
        const statusCode = result.message.includes('not found') ? 
          config.httpCodes.NOT_FOUND : config.httpCodes.INTERNAL_ERROR;
        res.status(statusCode).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Process moto payment controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async createManualAuto(req, res) {
    try {
      const result = await VehicleService.createManualAuto(req.body);

      if (result.success) {
        res.status(config.httpCodes.CREATED).json(result.data);
      } else {
        res.status(config.httpCodes.INTERNAL_ERROR).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Create manual auto controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async createManualMoto(req, res) {
    try {
      const result = await VehicleService.createManualMoto(req.body);

      if (result.success) {
        res.status(config.httpCodes.CREATED).json(result.data);
      } else {
        res.status(config.httpCodes.INTERNAL_ERROR).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Create manual moto controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getBoletas(req, res) {
    try {
      const idPlaya = req.query.id_playa;
      const result = await VehicleService.getBoletas(idPlaya);

      if (result.success) {
        res.status(config.httpCodes.OK).json(result.data);
      } else {
        res.status(config.httpCodes.INTERNAL_ERROR).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Get boletas controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getTickets(req, res) {
    try {
      const idPlaya = req.query.id_playa;
      const result = await VehicleService.getTickets(idPlaya);

      if (result.success) {
        res.status(config.httpCodes.OK).json(result.data);
      } else {
        res.status(config.httpCodes.INTERNAL_ERROR).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Get tickets controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = VehicleController;