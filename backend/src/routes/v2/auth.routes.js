import { Router } from "express";
import {
  signupUser,
  loginUser,
  logoutUser,
} from "../../controllers/auth.controller.js";

export const router = Router();

/**
 * Auth Routes
 * หน้าที่: แมป HTTP Method & Path ไปยัง Controller ที่รับผิดชอบ
 */

// POST /auth/signup (signupUser)
router.post(["/signup", "/register"], signupUser);

// POST /auth/login (loginUser)
router.post("/login", loginUser);

// POST /auth/logout
router.post("/logout", logoutUser);
