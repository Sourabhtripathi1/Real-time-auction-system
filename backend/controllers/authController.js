import User from "../models/User.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { updateLastLogin } from "./profileController.js";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: "auction-system",
      audience: "auction-client",
    },
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    function validatePasswordStrength(password) {
      const errors = [];
      if (password.length < 8) errors.push("At least 8 characters");
      if (password.length > 72) errors.push("Maximum 72 characters");
      if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
      if (!/[a-z]/.test(password)) errors.push("At least one lowercase letter");
      if (!/[0-9]/.test(password)) errors.push("At least one number");
      return errors;
    }

    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      throw new ApiError(
        400,
        `Password requirements not met: ${passwordErrors.join(", ")}`,
      );
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      throw new ApiError(400, "User already exists");
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "bidder",
    });

    const token = generateToken(user);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    // Remove password from response
    user.password = undefined;

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user, token, expiresAt },
          "User registered successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Please provide email and password");
    }

    const user = await User.findOne({ email }).select("+password +isBlocked");

    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, "Invalid credentials");
    }

    if (user.isBlocked) {
      throw new ApiError(403, "Your account has been blocked");
    }

    const token = generateToken(user);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    // Update last login timestamp (non-blocking)
    updateLastLogin(user._id);

    user.password = undefined;

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user, token, expiresAt },
          "User logged in successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, user, "User details retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(200).json(new ApiResponse(200, null, "Logged out"));
    }

    // Decode token to get expiry time
    const decoded = jwt.decode(token);

    if (decoded && decoded.exp) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      // Add token to blacklist until it naturally expires
      await TokenBlacklist.create({
        tokenHash,
        expiresAt: new Date(decoded.exp * 1000),
      });
    }

    res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
  } catch (error) {
    next(error);
  }
};
