import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const authUser = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token!",
    });
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    let role = decodedToken.role;
    if (!role) {
      const user = await User.findById(decodedToken.userId).select("role");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User no longer exists",
        });
      }
      role = user.role;
    }

    req.user = {
      _id: decodedToken.userId,
      role,
      user: {
        _id: decodedToken.userId,
        role,
      },
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};