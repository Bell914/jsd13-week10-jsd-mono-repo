import { Router } from "express";
import { router as usersRoutes } from "./users.routes.js";
export const routes = Router();

routes.use("/users", usersRoutes);