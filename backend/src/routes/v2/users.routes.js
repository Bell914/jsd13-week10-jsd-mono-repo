import { Router } from "express";
import { User } from "../../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authUser } from "../../middlewares/authUser.js";
import { requireAdmin } from "../../middlewares/authRole.js";

export const router = Router();

// Read all users (สไลด์หน้า 21: GET /users)
router.get("/", async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    return res.json(users);
  } catch (err) {
    next(err);
  }
});

// Create user (POST /users)
router.post("/", async (req, res, next) => {
  try {
    const { username, role = "user", email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "username, email and password are required." });
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
});

// GET /users/me (สไลด์หน้า 21: Get logged-in user profile from JWT)
// รองรับทั้ง /me และ /auth เพื่อ backward compatibility
router.get(["/me", "/auth"], authUser, async (req, res, next) => {
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
});

// PATCH /users/me (สไลด์หน้า 21: Update logged-in user's own details)
router.patch("/me", authUser, async (req, res, next) => {
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
      return res.status(404).json({ success: false, message: "User not found" });
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
});

// PATCH /users/:userId/role (สไลด์หน้า 21: Admin change user role)
router.patch("/:userId/role", authUser, requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Valid role ('user' or 'admin') is required",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
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
});

// PATCH /users/:userId (สไลด์หน้า 21: Admin update user details)
router.patch("/:userId", authUser, requireAdmin, async (req, res, next) => {
  try {
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
      req.params.userId,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
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
});

// Update user with PUT (for dashboard backward compatibility)
router.put("/:id", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "username, email and password are required!" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, password },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found!" });
    }

    return res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
});

// Delete user (สไลด์หน้า 21: DELETE /users/:userId)
router.delete("/:id", async (req, res, next) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found!" });
    }

    return res.json(deletedUser);
  } catch (err) {
    next(err);
  }
});

// Login user (backward compatibility)
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and Password are required!" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found!" });
    }

    const isMatched = await bcrypt.compare(password, user.password);

    if (!isMatched) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect password!" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Logout user (backward compatibility)
router.post("/logout", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful!",
  });
});