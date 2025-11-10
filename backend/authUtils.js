const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  try {
    const token = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'asdfgewlnclnlhjkl',
      { expiresIn: '1h' }
    );
    return token;
  } catch (error) {
    throw new Error('Error generating token');
  }
};

const validateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'Authentication failed. No token provided.' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'asdfgewlnclnlhjkl');
    
    req.userId = decoded.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Authentication failed. Token expired.' });
    }
    return res.status(400).json({ message: 'Authentication failed. Invalid token.' });
  }
};

module.exports = { generateToken, validateToken };

