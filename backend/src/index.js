import 'dotenv/config'; // Modern way to load dotenv
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import authRoutes from './routes/auth.js'; 
import taskRoutes from './routes/tasks.js';
import './config/passport.js';

const app = express();

// 1. CORS MUST be first
app.use(cors({ 
  origin: 'http://localhost:5173', 
  credentials: true 
}));

app.use(express.json());

// 2. SESSION MUST be second
app.use(session({
  name: 'todo_sid', // Custom name makes it easier to find in DevTools
  secret: process.env.SESSION_SECRET,
  resave: false,              
  saveUninitialized: false,   
  cookie: { 
    secure: false, // http only
    httpOnly: true, 
    sameSite: 'lax',
    domain: 'localhost', // Explicitly tie it to localhost
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// 3. PASSPORT MUST be third
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));