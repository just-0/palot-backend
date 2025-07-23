require("dotenv").config();

const serverConfig = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || "localhost",
  nodeEnv: process.env.NODE_ENV || "development",
  timezone: process.env.TIMEZONE || "America/Lima",

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:4200",
    methods: process.env.CORS_METHODS || "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders:
      process.env.CORS_HEADERS || "Content-Type,Authorization,userId,userType",
  },

  camera: {
    url: process.env.CAM_URL,
    user: process.env.CAM_USER,
    password: process.env.CAM_PASSWORD,
    timeout: parseInt(process.env.CAM_TIMEOUT) || 5000,
  },

  httpCodes: {
    OK: parseInt(process.env.HTTP_OK) || 200,
    CREATED: parseInt(process.env.HTTP_CREATED) || 201,
    BAD_REQUEST: parseInt(process.env.HTTP_BAD_REQUEST) || 400,
    UNAUTHORIZED: parseInt(process.env.HTTP_UNAUTHORIZED) || 401,
    FORBIDDEN: parseInt(process.env.HTTP_FORBIDDEN) || 403,
    NOT_FOUND: parseInt(process.env.HTTP_NOT_FOUND) || 404,
    INTERNAL_ERROR: parseInt(process.env.HTTP_INTERNAL_ERROR) || 500,
  },

  loginErrors: {
    WRONG_PASSWORD: parseInt(process.env.LOGIN_ERROR_WRONG_PASSWORD) || 1,
    USER_NOT_FOUND: parseInt(process.env.LOGIN_ERROR_USER_NOT_FOUND) || 2,
    DB_ERROR: parseInt(process.env.LOGIN_ERROR_DB_ERROR) || 3,
  },
};

module.exports = serverConfig;
