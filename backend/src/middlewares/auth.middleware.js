const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check for token in cookies or Bearer Authorization header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Return 401 if token is missing
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    // 3. Verify token validity and expiration
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 4. Fetch user from DB (excluding password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // 5. Attach user document to request object
    req.user = user;

    // 6. Proceed to next handler
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

module.exports = {
  protect,
};
