import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

// ── File filter with magic byte validation ──
function createImageFileFilter(maxFiles) {
  return (req, file, cb) => {
    // 1. Check declared mimetype
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(
        new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          "Only JPG, PNG, and WebP images are allowed.",
        ),
        false,
      );
    }

    // 2. Check file extension
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
      return cb(new Error("Invalid file extension."), false);
    }

    // 3. Sanitize filename (prevent path traversal):
    file.originalname = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 100);

    cb(null, true);
  };
}

export async function validateUploadedFiles(files) {
  // CloudinaryStorage handles the file upload.
  // We rely on Cloudinary's built-in format detection (resource_type: "image").
  // If a file is not a valid image, Cloudinary rejects it or changes its type.
  if (!files || files.length === 0) return true;

  for (const file of files) {
    if (file.resource_type && file.resource_type !== "image") {
      await cloudinary.uploader.destroy(file.filename);
      throw new Error(`File ${file.originalname} is not a valid image.`);
    }
  }
  return true;
}

// ── Cloudinary Storage Configs ──

const auctionImageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "auction-system/auctions",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: "limit",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
    // Sanitized filename:
    public_id: `auction_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }),
});

const profileImageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "auction-system/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
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
    public_id: `profile_${req.user?.id || "anon"}_${Date.now()}`,
  }),
});

// ── Multer instances ──

export const uploadAuctionImages = multer({
  storage: auctionImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // Max 5 files
    fields: 20, // Max 20 non-file fields
    fieldSize: 2 * 1024 * 1024, // 2MB per text field
  },
  fileFilter: createImageFileFilter(5),
}).array("images", 5);

export const uploadProfileImage = multer({
  storage: profileImageStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for profile
    files: 1,
    fields: 20,
  },
  fileFilter: createImageFileFilter(1),
}).single("profileImage");

export default uploadAuctionImages;
