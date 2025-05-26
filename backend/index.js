const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// PostgreSQL Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

// Wait for DB and setup schema
const waitForPostgres = async (retries = 10, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("✅ Connected to PostgreSQL!");
      return;
    } catch (err) {
      console.log(`⏳ Waiting for Postgres... (${i + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  console.error("❌ Could not connect to Postgres after retries.");
  process.exit(1);
};

waitForPostgres().then(() => {
  pool
    .query(
      `
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      done BOOLEAN DEFAULT false,
      tags TEXT[] DEFAULT ARRAY[]::TEXT[],
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
    )
    .then(() => console.log("🗃️ Todos table ready"))
    .catch(console.error);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK from backend!" });
});

// Get todos
app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM todos ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/todos failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add todo
app.post("/api/todos", async (req, res) => {
  const { text, tags = [], deadline } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO todos (text, tags, deadline) VALUES ($1, $2, $3) RETURNING *",
      [text, tags, deadline]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Failed to add todo:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update todo
app.patch("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { done, text, tags } = req.body;

  const fields = [];
  const values = [];
  let index = 1;

  if (done !== undefined) {
    fields.push(`done = $${index++}`);
    values.push(done);
  }

  if (text !== undefined) {
    fields.push(`text = $${index++}`);
    values.push(text);
  }

  if (tags !== undefined) {
    fields.push(`tags = $${index++}`);
    values.push(tags);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "No valid fields provided." });
  }
  if (deadline !== undefined) {
    fields.push(`deadline = $${index++}`);
    values.push(deadline);
  }

  values.push(id);

  const query = `
    UPDATE todos
    SET ${fields.join(", ")}, updated_at = NOW()
    WHERE id = $${index}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Failed to update todo:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete todo
app.delete("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM todos WHERE id = $1", [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error("❌ Failed to delete todo:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Request Logger
app.use((req, res, next) => {
  console.log(`👉 ${req.method} ${req.url}`);
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
