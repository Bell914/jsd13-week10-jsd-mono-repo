import express from "express";
import { users } from "./fakeDB/fakeUsers.js";

const app = express();

// CRUD routes and endpoints

// Read users
app.get("/users", (req, res) => {
  res.json(users);
});

// Create user
app.post("/users", (req, res) => {});

// Update user
app.put("/users/:id", (req, res) => {});

// Delete user
app.delete("/users/:id", (req, res) => {});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on PORT:${PORT} 🟢`);
});