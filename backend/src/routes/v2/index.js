import { Router } from "express";
import { router as usersRoutes } from "./users.routes.js";
import { router as usersSupabaseRoutes } from "./users.supabase.routes.js";
import { router as authRoutes } from "./auth.routes.js";

export const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersSupabaseRoutes);
router.use("/users", usersRoutes);