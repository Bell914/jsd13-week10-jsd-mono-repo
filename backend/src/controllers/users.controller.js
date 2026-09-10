import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";

/**
 * Users Controllers
 * แยก Logic ออกจาก Routes ตามหลัก Software Architecture
 */

// GET /users (getAllUsers)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

// GET /users/me (getCurrentUser)
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /users/me (updateCurrentUser)
export const updateCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.user?._id;
    const { username, email, password } = req.body;

    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided to update",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { password: _pw, ...userWithoutPassword } = updatedUser.toObject();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: userWithoutPassword,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /users/:userId/role (updateUserRole)
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetId = req.params.userId || req.params.id;

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Valid role ('user' or 'admin') is required",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetId,
      { role },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /users/:userId หรือ PUT /users/:id (updateUserById)
export const updateUserById = async (req, res, next) => {
  try {
    const targetId = req.params.userId || req.params.id;
    const { username, email, role, password } = req.body;

    const updateFields = {};
    if (username !== undefined) updateFields.username = username;
    if (email !== undefined) updateFields.email = email;
    if (role !== undefined) updateFields.role = role;
    if (password !== undefined && password !== "") {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided to update",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetId,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { password: _pw, ...userWithoutPassword } = updatedUser.toObject();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: userWithoutPassword,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /users/:userId (deleteUserById)
export const deleteUserById = async (req, res, next) => {
  try {
    const targetId = req.params.userId || req.params.id;
    const deletedUser = await User.findByIdAndDelete(targetId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found!",
      });
    }

    return res.status(200).json(deletedUser);
  } catch (err) {
    next(err);
  }
};

// POST /users (Create User)
export const createUser = async (req, res, next) => {
  try {
    const { username, role = "user", email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "username, email and password are required.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      role,
      email,
      password: hashedPassword,
    });

    const { password: _password, ...userWithoutPassword } = newUser.toObject();

    return res.status(201).json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
};
