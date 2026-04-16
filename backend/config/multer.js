import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";
import multer from "multer";

// ── Auction image storage ──────────────────────────────────
const auctionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "auction-system",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: "limit",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  },
});

const auctionUpload = multer({
  storage: auctionStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
      error.message = "Only jpg, png, webp images are allowed";
      cb(error, false);
    }
  },
});

export const uploadAuctionImages = auctionUpload.array("images", 5);
export const uploadSingleImage   = auctionUpload.single("image");

// ── Profile image storage ──────────────────────────────────
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "auction-system/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "face",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  },
});

export const uploadProfileImage = multer({
  storage: profileImageStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
      error.message = "Only jpg, png, webp images allowed for profile";
      cb(error, false);
    }
  },
}).single("profileImage");

export default auctionUpload;
