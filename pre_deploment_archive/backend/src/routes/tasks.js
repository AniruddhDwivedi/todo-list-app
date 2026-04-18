import express from 'express';
import client from '../config/redis.js';
import crypto from 'crypto';

const router = express.Router();

router.get('/', async (req, res) => {
    const userId = req.user.google_id;
    const taskIds = await client.sMembers(`user:${userId}:tasks`);

    const tasks = await Promise.all(
        taskIds.map(async (id) => await client.hGetAll(`task:${id}`))
    );
    res.json(tasks);
});

router.post('/', async (req, res) => {
    const { title, deadline } = req.body;
    const taskId = crypto.randomUUID();
    const userId = req.user.google_id;

    const taskData = {
        id: taskId,
        title,
        deadline,
        completed: 'false',
        user_id: userId
    };

    await client.hSet(`task:${taskId}`, taskData);
    await client.sAdd(`user:${userId}:tasks`, taskId);
    res.json(taskData);
});

router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const taskKey = `task:${id}`;
    const task = await client.hGetAll(taskKey);

    if (!task || task.user_id !== req.user.google_id) {
        return res.status(404).send("Task not found");
    }

    await client.hSet(taskKey, 'completed', String(completed));
    const updatedTask = await client.hGetAll(taskKey);
    res.json(updatedTask);
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const taskKey = `task:${id}`;
    const userId = req.user.google_id;

    // Check ownership
    const taskOwner = await client.hGet(taskKey, 'user_id');
    if (taskOwner !== userId) return res.status(404).send("Task not found");

    await client.del(taskKey);
    await client.sRem(`user:${userId}:tasks`, id);
    res.json({ message: 'Task deleted successfully' });
});

export default router;