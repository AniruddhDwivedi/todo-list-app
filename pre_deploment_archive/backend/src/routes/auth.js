import express from 'express';
import passport from 'passport';
import client from '../config/redis.js';
import { sendOTP } from '../services/emailService.js';

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/me', (req, res) => {
    if (req.isAuthenticated() && req.user) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: "Not authenticated" });
    }
});

router.post('/update-public-key', async (req, res) => {
    if (!req.user) return res.status(401).send("Unauthorized");
    const { publicKey } = req.body;
    const userKey = `user:${req.user.google_id}:profile`;
    
    await client.hSet(userKey, 'public_key', publicKey);
    res.json({ message: "Public key stored successfully" });
});

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
    async (req, res) => {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const mfaKey = `mfa:${req.user.google_id}`;

        // Store OTP in Redis and set to expire in 600 seconds (10 mins)
        await client.set(mfaKey, otp, { EX: 600 });

        try {
            await sendOTP(req.user.email, otp);
            res.redirect(`http://localhost:5173/verify-mfa?userId=${req.user.google_id}`);
        } catch (error) {
            res.status(500).send("Error sending MFA email.");
        }
    }
);

router.post('/verify-mfa', async (req, res) => {
    const { userId, code } = req.body;
    const mfaKey = `mfa:${userId}`;
    const storedOtp = await client.get(mfaKey);

    if (storedOtp && storedOtp === code) {
        const user = await client.hGetAll(`user:${userId}:profile`);
        await client.del(mfaKey); // OTP used, delete it

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: "Auth failed" });
            req.session.save(() => res.json({ message: "Authenticated", user }));
        });
    } else {
        res.status(401).json({ error: "Invalid or expired code" });
    }
});

export default router;