// CRUD routes and endpoints

// Read users
app.get("/users", (req, res) => {
  console.log(req);
  res.json(users);
});

// Create user
app.post("/users", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.json({
      error: "username, email and password are required!",
    });
  }
});

// Update user
app.put("/users/:id", (req, res) => {});

// Delete user
app.delete("/users/:id", (req, res) => {});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on PORT:${PORT} 🟢`);
});