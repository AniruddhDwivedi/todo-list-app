// import express from 'express';
// import passport from 'passport';
// import pool from '../config/db.js';
// import { sendOTP } from '../services/emailService.js';

// const router = express.Router();

// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// router.get('/me', (req, res) => {
//   if (req.isAuthenticated() && req.user) {
//     res.json(req.user);
//   } else {
//     res.status(401).json({ error: "Not authenticated" });
//   }
// });

// router.post('/update-public-key', async (req, res) => {
//   if (!req.user) return res.status(401).send("Unauthorized");
//   const { publicKey } = req.body;
  
//   try {
//     await pool.query(
//       'UPDATE users SET public_key = $1 WHERE id = $2',
//       [publicKey, req.user.id]
//     );
//     res.json({ message: "Public key stored successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// router.get('/google/callback', 
//   passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
//   async (req, res) => {
//     // ... your OTP logic ...
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     await pool.query(
//       "INSERT INTO mfa_codes (user_id, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')",
//       [req.user.id, otp]
//     );
//     try {
//     await sendOTP(req.user.email, otp);
//     res.redirect(`http://localhost:5173/verify-mfa?userId=${req.user.id}`);
//   }catch (error) {
//     console.error("MFA Email failed to send:", error);
//     res.status(500).send("Error sending MFA email. Check backend logs.");
//   }
// });

// router.post('/verify-mfa', async (req, res) => {
//   const { userId, code } = req.body;
//   const result = await pool.query(
//     "SELECT * FROM mfa_codes WHERE user_id = $1 AND code = $2 AND expires_at > NOW()",
//     [userId, code]
//   );

//   if (result.rows.length > 0) {
//     const user = (await pool.query("SELECT * FROM users WHERE id = $1", [userId])).rows[0];

//     req.login(user, (err) => {
//       if (err) return res.status(500).json({ error: "Auth failed" });
      
//       req.session.save((saveErr) => {
//         if (saveErr) return res.status(500).json({ error: "Session save failed" });
//         return res.json({ message: "Authenticated", user });
//       });
//     });
//   } else {
//     res.status(401).json({ error: "Invalid code" });
//   }
// });

// export default router;