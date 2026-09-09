import { Router } from "express";
import bcrypt from "bcrypt";
import { User } from "../../models/user.model.js";

export const router = Router();

/**
 * STEP 1: REGISTER ROUTE
 * Flow: Read (email, password) -> Hash (bcrypt.hash) -> Store (MongoDB) -> Respond (ไม่ส่ง password กลับ)
 * POST /register หรือ POST /api/v2/auth/register
 */
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    // 1. Read & Validate input
    if (!email || !password) {
      return res.status(400).json({
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
        message: existingUser.email === email ? "Email already exists" : "Username already exists",
      });
    }

    // 2. Hash password ด้วย bcrypt.hash(password, saltRounds)
    // ใช้ saltRounds = 10 ตามตัวอย่างในสไลด์
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
      message: "Registered",
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
 * STEP 2: LOGIN ROUTE
 * Flow: Find user by email -> Compare (bcrypt.compare) -> Respond
 * POST /login หรือ POST /api/v2/auth/login
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Read & Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2. Find user by email
    // หมายเหตุ: ต้องใช้ .select("+password") เพราะใน user.model.js กำหนด select: false ไว้
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Compare candidate password กับ stored hash ด้วย bcrypt.compare
    // ลำดับ argument: compare(plainPassword, storedHash)
    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Login สำเร็จ
    return res.json({
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
