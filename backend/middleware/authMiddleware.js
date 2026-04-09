import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'Not authorized, no token provided');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('+isBlocked');
      
      if (!user) {
        throw new ApiError(401, 'Not authorized, user not found');
      }

      req.user = user;
      next();
    } catch (error) {
      throw new ApiError(401, 'Not authorized, token failed or expired');
    }
  } catch (error) {
    next(error);
  }
};
