import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from './db.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    const { id, displayName, emails, photos } = profile;
    try {
      const res = await pool.query(
        `INSERT INTO users (id, email, display_name, avatar_url) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (id) DO UPDATE SET display_name = $3, avatar_url = $4 
         RETURNING *`,
        [id, emails[0].value, displayName, photos[0].value]
      );
      return done(null, res.rows[0]);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  done(null, res.rows[0]);
});

export default passport;