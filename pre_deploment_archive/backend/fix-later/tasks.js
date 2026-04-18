import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY id ASC', 
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE A TASK (POST /api/tasks)
router.post('/', async (req, res) => {
  const { title, deadline } = req.body;
  
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, deadline, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title, deadline, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Change this:
router.patch('/:id', async (req, res) => { // Removed '/api/tasks'
  const { id } = req.params;
  const { completed } = req.body;
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await pool.query(
      'UPDATE tasks SET completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [completed, id, req.user.id] // Added user_id check for security!
    );
    if (result.rows.length === 0) return res.status(404).send("Task not found");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change this:
router.delete('/:id', async (req, res) => { // Removed '/api/tasks'
  const { id } = req.params;
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2', 
      [id, req.user.id] // Only delete if it belongs to the user
    );
    if (result.rowCount === 0) return res.status(404).send("Task not found");
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;