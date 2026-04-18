import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { uploadProfileImage } from "../config/multer.js";
import {
  getProfile,
  updateProfile,
  changePassword,
  removeProfileImage,
} from "../controllers/profileController.js";
import multer from "multer";

const router = express.Router();

// All routes require authentication
router.get("/me", protect, getProfile);
router.patch("/update", protect, uploadProfileImage, updateProfile);
router.patch("/change-password", protect, changePassword);
router.delete("/remove-image", protect, removeProfileImage);

// Multer error handler for profile image upload errors
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ success: false, message: "Profile image must not exceed 2MB" });
    }
    return res
      .status(400)
      .json({ success: false, message: err.message || "File upload error" });
  }
  next(err);
});

export default router;
