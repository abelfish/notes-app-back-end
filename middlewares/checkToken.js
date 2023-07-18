const { SECRET } = require('../config');
const jwt = require('jsonwebtoken');

module.exports.checkToken = async (req, res, next) => {
  try {
    const auth_String = req.headers.authorization;
    if (!auth_String)
      res.status(403).json({ success: false, results: 'Token not found' });
    const token = auth_String.split(' ')[1];
    const decoded_token = jwt.verify(token, SECRET);
    req.token = decoded_token;
    next();
  } catch (error) {
    next(error);
  }
};
