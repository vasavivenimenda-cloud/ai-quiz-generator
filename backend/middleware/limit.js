// Simple in-memory rate limiter (per IP). Use Redis-backed limiter if you deploy multiple servers.
module.exports = (max, windowMs) => { const hits = new Map();
  return (req, res, next) => { const now = Date.now(), k = req.ip, h = (hits.get(k) || []).filter(t => now - t < windowMs);
    if (h.length >= max) return res.status(429).json({ message: 'Too many requests. Please wait a minute and try again.' });
    h.push(now); hits.set(k, h); next(); }; };
