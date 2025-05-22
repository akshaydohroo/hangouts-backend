import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 1 * 10 * 1000, // 1 minute
  max: 200,
  message: { error: 'Too many requests' },
  standardHeaders: true, // Adds `RateLimit-*` headers
  legacyHeaders: false, // Disables `X-RateLimit-*` headers
  keyGenerator: req =>
    (req.cookies && req.cookies['access-token']) ||
    req.headers.authorization ||
    req.ip,
})
export default limiter
