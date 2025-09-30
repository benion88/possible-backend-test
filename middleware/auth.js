const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'Token is not valid.' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

// Verify API key
exports.verifyApiKey = async (req, res, next) => {
  try {
    const apiKey = req.header('x-api-key');
    
    if (!apiKey) {
      return res.status(401).json({ message: 'Access denied. No API key provided.' });
    }

    const user = await User.findOne({ apiKey });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid API key.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid API key.' });
  }
};