import { Router } from "express";
import bcrypt from "bcrypt";
import { supabase } from "../../config/supabase.js";

export const router = Router();

const PG_SELECT = "id, username, email, role, created_at, updated_at";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Read all users
// GET /api/v2/users/pg
router.get("/pg", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(PG_SELECT)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
});

// Read user by ID
// GET /api/v2/users/pg/:id
router.get("/pg/:id", async (req, res, next) => {
  try {
    if (!UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { data, error } = await supabase
      .from("users")
      .select(PG_SELECT)
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
});

// Create user
// POST /api/v2/users/pg
router.post("/pg", async (req, res, next) => {
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

    // Check if email or username already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id, email, username")
      .or(`email.eq.${email},username.eq.${username}`);

    if (checkError) throw checkError;

    if (existingUsers && existingUsers.length > 0) {
      const match = existingUsers[0];
      const field = match.email === email ? "Email" : "Username";
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert({
        username,
        email,
        password: hashedPassword,
        role,
      })
      .select(PG_SELECT)
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
});

// Update user
// PUT /api/v2/users/pg/:id
router.put("/pg/:id", async (req, res, next) => {
  try {
    if (!UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { username, email, password, role } = req.body;

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined && password !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (role !== undefined) updateData.role = role;

    // Check if any actual field other than updated_at was supplied
    if (Object.keys(updateData).length <= 1) {
      return res.status(400).json({
        success: false,
        message: "No data provided for update",
      });
    }

    // Check for duplicate username or email with other users
    const conflictFilters = [];
    if (updateData.email) conflictFilters.push(`email.eq.${updateData.email}`);
    if (updateData.username) conflictFilters.push(`username.eq.${updateData.username}`);

    if (conflictFilters.length > 0) {
      const { data: conflictUsers, error: conflictErr } = await supabase
        .from("users")
        .select("id, email, username")
        .neq("id", req.params.id)
        .or(conflictFilters.join(","));

      if (conflictErr) throw conflictErr;

      if (conflictUsers && conflictUsers.length > 0) {
        const match = conflictUsers[0];
        const field = match.email === updateData.email ? "Email" : "Username";
        return res.status(409).json({
          success: false,
          message: `${field} already exists`,
        });
      }
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", req.params.id)
      .select(PG_SELECT)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
});

// Delete user
// DELETE /api/v2/users/pg/:id
router.delete("/pg/:id", async (req, res, next) => {
  try {
    if (!UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", req.params.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
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