const errorMiddleware = (err, req, res, next) => {
  
  let statusCode = err.statusCode || 500;
  let message = "Something went wrong";
  console.error("ERROR CAUGHT IN MIDDLEWARE:", err);

  // 1. Mongoose Bad ObjectId Error
  if (err.name === "CastError") {
    message = "Invalid request";
    statusCode = 400;
  }

  // 2. Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyPattern || err.keyValue || {})[0];
    if (duplicateField === "phone" || (err.message && err.message.includes("phone"))) {
      message = "Mobile number is already registered";
    } else {
      message = "Already registered";
    }
  }

  // 3. Mongoose Validation Error 
  if (err.name === "ValidationError") {
    message = "Invalid request data";
    statusCode = 422;
  }

  // 4. Joi Validation Error 
  if (err.isJoi) {
    message = "Invalid request data";
    statusCode = 422;
  }

  // 5. JWT Errors 
  if (err.name === "JsonWebTokenError") {
    message = "Unauthorized";
    statusCode = 401;
  }
  if (err.name === "TokenExpiredError") {
    message = "Session expired";
    statusCode = 401;
  }

  // Final Response
  const response = {
    success: false,
    message: message,
  };

  // Expose debug info in development or for admin requests
  if (process.env.NODE_ENV !== "production" || (process.env.ADMIN_API_KEY && req.headers["x-api-key"] === process.env.ADMIN_API_KEY)) {
    response.debugError = err.message;
    response.debugStack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorMiddleware;