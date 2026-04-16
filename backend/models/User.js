import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "seller", "bidder"],
        message: "{VALUE} is not a valid role",
      },
      default: "bidder",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },

    // ── Profile fields ─────────────────────────────────────
    contactNumber: {
      type: String,
      trim: true,
      match: [
        /^[0-9]{10,15}$/,
        "Enter a valid contact number (10-15 digits)",
      ],
      default: null,
    },
    profileImage: {
      type: {
        url: { type: String },
        publicId: { type: String },
      },
      default: null,
    },
    address: {
      street:  { type: String, trim: true, default: null },
      city:    { type: String, trim: true, default: null },
      state:   { type: String, trim: true, default: null },
      pincode: { type: String, trim: true, default: null },
      country: { type: String, trim: true, default: "India" },
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    strict: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Virtual: profileCompletion (0–100) ─────────────────────
userSchema.virtual("profileCompletion").get(function () {
  let score = 0;
  if (this.name)                 score += 20;
  if (this.contactNumber)        score += 20;
  if (this.profileImage?.url)    score += 20;
  if (this.address?.city)        score += 20;
  if (this.address?.state)       score += 20;
  return score;
});

// ── Indexes ────────────────────────────────────────────────
userSchema.index({ role: 1 });

// ── Pre-save hook: hash password ───────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance method: compare password ─────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
