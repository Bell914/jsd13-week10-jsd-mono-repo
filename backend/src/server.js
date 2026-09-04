import express from "express";
import { users } from "./fakeDB/fakeUsers.js";

const app = express();

app.use(express.json());

// CRUD routes

// Read users
app.get("/users", (req, res) => {
  console.log(req.method, req.url);
  res.json(users);
});

// Create user
app.post("/users", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "username, email and password are required!" });
  }

  const highestId = users.reduce(
    (max, user) => Math.max(max, Number(user.id)),
    0
  );

  const nextId = String(highestId + 1);

  const newUser = {
    id: nextId,
    username: username,
    email: email,
    password: password,
  };

  users.push(newUser);

  return res.status(201).json(newUser);
});

// Update user
app.put("/users/:id", (req, res) => {
  const user = users.find((u) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found!",
    });
  }

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "username, email and password are required!" });
  }

  user.username = username;
  user.email = email;
  user.password = password;

  return res.status(200).json(user);
});

// Delete user
app.delete("/users/:id", (req, res) => {
  const delIndex = req.params.id;

  const index = users.findIndex((u) => delIndex === u.id);

  // Validation ถ้าไม่เจอ user
  if (index === -1) {
    return res.status(404).json({
      error: "User not found!",
    });
  }

  // ลบ object ที่มี index 
  users.splice(index, 1);

  return res.status(200).json(users);
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on PORT:${PORT} 🟢`);
});