import { Router } from "express";
import mongoose from "mongoose";
import { User } from "../../models/user.model.js";

export const router = Router();

const USER_SELECT = "-password";

// GET USERS
// GET /api/v2/users
router.get("/", async (req, res, next) => {
  try {
    const users = await User.find()
      .select(USER_SELECT)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
});

// GET USER BY ID
// GET /api/v2/users/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findById(req.params.id).select(USER_SELECT);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// CREATE USER
// POST /api/v2/users
router.post("/", async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      role = "user",
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "username, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "Username";
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    const newUser = await User.create({
      username,
      email,
      password,
      role,
    });

    const user = await User.findById(newUser._id).select(USER_SELECT);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// UPDATE USER
// PUT /api/v2/users/:id
router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { username, email, password, role } = req.body;

    const updateData = {};

    if (username !== undefined) {
      updateData.username = username;
    }

    if (email !== undefined) {
      updateData.email = email;
    }

    if (password !== undefined && password !== "") {
      updateData.password = password;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided for update",
      });
    }

    // Check for duplicate username or email if they are being updated
    const conflictConditions = [];
    if (updateData.username) conflictConditions.push({ username: updateData.username });
    if (updateData.email) conflictConditions.push({ email: updateData.email });

    if (conflictConditions.length > 0) {
      const conflictUser = await User.findOne({
        _id: { $ne: req.params.id },
        $or: conflictConditions,
      });

      if (conflictUser) {
        const field = conflictUser.email === updateData.email ? "Email" : "Username";
        return res.status(409).json({
          success: false,
          message: `${field} already exists`,
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select(USER_SELECT);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE USER
// DELETE /api/v2/users/:id
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});