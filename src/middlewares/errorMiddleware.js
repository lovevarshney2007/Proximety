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
    message = "Already registered";
    statusCode = 409;
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
  res.status(statusCode).json({
    success: false,
    message: message,
    debugError: err.message,
    debugStack: err.stack,
  });
};

export default errorMiddleware;