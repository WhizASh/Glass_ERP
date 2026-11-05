// Centralized Error Handling Middleware

function errorHandler(err, req, res, next) {
  console.error("❌ API Error:", err);

  // Prisma unique constraint violation (e.g. duplicate SKU or Order number)
  if (err.code === "P2002") {
    const fields = err.meta && err.meta.target ? err.meta.target.join(", ") : "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${fields} already exists.`,
      error: err.message
    });
  }

  // Prisma record not found
  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "The requested record was not found.",
      error: err.message
    });
  }

  // Custom validation errors
  if (err.name === "ValidationError" || err.status === 400) {
    return res.status(400).json({
      success: false,
      message: err.message || "Invalid request parameters.",
      errors: err.errors || undefined
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error occurred.",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
}

module.exports = errorHandler;
