const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database
let todos = [
  { _id: 1, title: 'Learn React', completed: false, description: 'Learn React fundamentals' },
  { _id: 2, title: 'Build Todo App', completed: false, description: 'Create a full-stack todo application' },
  { _id: 3, title: 'Deploy Project', completed: true, description: 'Deploy the application to production' }
];

let users = [];
let nextTodoId = 4;
let nextUserId = 1;

// Mock authentication middleware
const verifyApiKey = (req, res, next) => {
  const apiKey = req.header('x-api-key');
  if (!apiKey) {
    return res.status(401).json({ message: 'API key required' });
  }
  next();
};

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Token required' });
  }
  
  try {
    const decoded = jwt.verify(token, 'dev-secret');
    req.user = users.find(u => u.id === decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running with in-memory database!' });
});

// Public endpoint - Get all todos
app.get('/api/todos', verifyApiKey, (req, res) => {
  const publicTodos = todos.map(todo => ({
    _id: todo._id,
    title: todo.title,
    completed: todo.completed
  }));
  res.json(publicTodos);
});

// Authenticated endpoint - Get single todo
app.get('/api/todos/:id', verifyToken, (req, res) => {
  const todo = todos.find(t => t._id == req.params.id);
  if (!todo) return res.status(404).json({ message: 'Todo not found' });
  res.json(todo);
});

// Update todo
app.put('/api/todos/:id', verifyToken, (req, res) => {
  const todoIndex = todos.findIndex(t => t._id == req.params.id);
  if (todoIndex === -1) return res.status(404).json({ message: 'Todo not found' });
  
  todos[todoIndex] = { ...todos[todoIndex], ...req.body };
  res.json(todos[todoIndex]);
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  const user = {
    id: nextUserId++,
    username,
    email,
    password, // In real app, hash this!
    apiKey: 'dev-key'
  };
  
  users.push(user);
  
  const token = jwt.sign({ id: user.id }, 'dev-secret', { expiresIn: '7d' });
  
  res.json({
    token,
    user: { id: user.id, username, email, apiKey: user.apiKey }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id }, 'dev-secret', { expiresIn: '7d' });
  
  res.json({
    token,
    user: { id: user.id, username: user.username, email, apiKey: user.apiKey }
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ No MongoDB required!`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});