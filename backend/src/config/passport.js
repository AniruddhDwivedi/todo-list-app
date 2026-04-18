import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import client from './redis.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const { id, displayName, emails, photos } = profile;
      const key = `user:${id}:profile`;

      const userData = await client.hGetAll(key);

      if (Object.keys(userData).length > 0) {
        return done(null, userData);
      }

      const newUser = {
        google_id: id,
        display_name: displayName,
        email: emails[0].value,
        avatar_url: photos[0].value,
        public_key: ""
      };

      await client.hSet(key, newUser);
      return done(null, newUser);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Use google_id to maintain consistency across Redis keys
passport.serializeUser((user, done) => {
    done(null, user.google_id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await client.hGetAll(`user:${id}:profile`);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;