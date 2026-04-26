import mongoose from "mongoose";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Multer-specific errors:
  if (err instanceof multer.MulterError) {
    const multerMessages = {
      LIMIT_FILE_SIZE: "File too large. Maximum size is 5MB per image.",
      LIMIT_FILE_COUNT: "Too many files. Maximum 5 images allowed.",
      LIMIT_UNEXPECTED_FILE: err.message || "Invalid file type.",
      LIMIT_FIELD_VALUE: "Form field value too large.",
      LIMIT_FIELD_COUNT: "Too many form fields.",
      LIMIT_PART_COUNT: "Too many parts in form data.",
    };
    return res.status(400).json({
      success: false,
      message: multerMessages[err.code] || "File upload error",
      code: err.code,
    });
  }

  // Handle Cloudinary errors:
  if (err.http_code) {
    console.error("Cloudinary error:", err);
    return res.status(500).json({
      success: false,
      message: "Image upload service error. Please try again.",
      code: "CLOUDINARY_ERROR",
    });
  }

  // Wrap non-ApiError instances
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], error.stack);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === "CastError") {
    error = new ApiError(404, `Resource not found. Invalid: ${err.path}`);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new ApiError(400, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(", ");
    error = new ApiError(400, `Duplicate value for field: ${field}`);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token. Please log in again.");
  }

  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Token expired. Please log in again.");
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  res.status(error.statusCode || 500).json(response);
};
