import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import authRoutes from './routes/auth.js'; 
import taskRoutes from './routes/tasks.js';
import './config/passport.js';

const app = express();

// 1. Declare CORS policies
app.use(cors({ 
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

//Emergency checks
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  next();
});

app.use(express.json());

// Initialize session SESSION MUST be second
app.use(session({
  name: 'todo_sid',
  secret: process.env.SESSION_SECRET,
  resave: false,              
  saveUninitialized: false,   
  cookie: { 
    secure: false, 
    httpOnly: true, 
    sameSite: 'lax',
    domain: 'localhost',
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// 3. Initialize mfa routes
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', user: req.user || 'no user' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));