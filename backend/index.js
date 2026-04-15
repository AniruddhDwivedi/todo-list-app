require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Replace with your actual GCP VM External IP and password
const pool = new Pool({
  user: 'postgres',
  host: process.env.GCP_EXTERNAL_IP,
  database: 'todo_db',
  password: process.env.POSTGRE_PASS,
  port: 5432,
});

// Test Connection
pool.connect((err) => {
  if (err) console.error('Connection error', err.stack);
  else console.log('Connected to PostgreSQL on GCP');
});

// GET: Fetch tasks from DB
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Save a new task to DB
app.post('/api/tasks', async (req, res) => {
  const { title, deadline } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, deadline) VALUES ($1, $2) RETURNING *',
      [title, deadline]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *',
      [completed, id]
    );
    if (result.rows.length === 0) return res.status(404).send("Task not found");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    // Check if anything was actually deleted
    if (result.rowCount === 0) return res.status(404).send("Task not found");
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Backend listening on port 3001'));