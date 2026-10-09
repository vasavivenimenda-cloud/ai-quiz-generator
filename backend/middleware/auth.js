const jwt = require('jsonwebtoken');
exports.protect = (req, res, next) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.userId = jwt.verify(t, process.env.JWT_SECRET).id; next(); }
  catch { res.status(401).json({ message: 'Please log in to continue' }); }
};
exports.wrap = f => (q, s, n) => Promise.resolve(f(q, s, n)).catch(n);
