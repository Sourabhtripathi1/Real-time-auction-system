import { ApiError } from '../utils/ApiError.js';

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated'));
    }

    if (req.user.isBlocked) {
      return next(new ApiError(403, 'Your account has been blocked'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role '${req.user.role}' is not allowed to access this resource`)
      );
    }
    
    next();
  };
};
