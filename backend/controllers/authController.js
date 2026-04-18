import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { updateLastLogin } from "./profileController.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

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

    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res
      .status(201)
      .json(
        new ApiResponse(201, { user, token }, "User registered successfully"),
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

    const token = generateToken(user._id);

    // Update last login timestamp (non-blocking)
    updateLastLogin(user._id);

    user.password = undefined;

    res
      .status(200)
      .json(
        new ApiResponse(200, { user, token }, "User logged in successfully"),
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
