import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../../models/user.model.js";

export const router = Router();

/**
 * STEP 1: REGISTER / SIGNUP ROUTE (สไลด์หน้า 21 & 22)
 * Flow: Read (email, password) -> Hash (bcrypt.hash) -> Store (MongoDB) -> Respond (ไม่ส่ง password กลับ)
 * POST /auth/signup หรือ POST /auth/register
 */
router.post(["/signup", "/register"], async (req, res, next) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    // 1. Read & Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // ตรวจสอบ user ซ้ำ (email หรือ username)
    const existingUser = await User.findOne({
      $or: [
        { email },
        ...(username ? [{ username }] : []),
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email ? "Email already exists" : "Username already exists",
      });
    }

    // 2. Hash password ด้วย bcrypt.hash(password, saltRounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Store: บันทึกข้อมูลลง MongoDB โดยเก็บ passwordHash แทน raw password
    const newUser = await User.create({
      username: username || email.split("@")[0],
      email,
      password: passwordHash,
      role,
    });

    // 4. Respond: ส่ง status 201 พร้อมข้อความยืนยัน (ไม่ส่ง password กลับไปเด็ดขาด)
    return res.status(201).json({
      success: true,
      message: "Registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * STEP 2: LOGIN ROUTE (สไลด์หน้า 21, 62-66)
 * Flow: Find user by email -> Compare (bcrypt.compare) -> Issue JWT in HttpOnly Cookie -> Respond
 * POST /auth/login
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Read & Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Find user by email (select +password เพราะใน Schema มี select: false)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 3. Compare password ด้วย bcrypt.compare
    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 4. Issue JWT Token (สไลด์หน้า 62-66)
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5. Store Token in HttpOnly Cookie (สไลด์หน้า 64-65)
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

    // 6. Respond สำเร็จ
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * STEP 3: LOGOUT ROUTE
 * Flow: Clear HttpOnly Cookie -> Respond
 * POST /auth/logout
 */
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
    message: "Logout successful",
  });
});
