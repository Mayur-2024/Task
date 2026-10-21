const configuredOrigin = new URL(
  process.env.CLIENT_URL || 'http://localhost:5173'
).origin;
const allowedOrigins = [configuredOrigin];

if (process.env.NODE_ENV !== 'production') {
  const localUrl = new URL(configuredOrigin);

  if (localUrl.hostname === 'localhost' || localUrl.hostname === '127.0.0.1') {
    localUrl.hostname = localUrl.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
    allowedOrigins.push(localUrl.origin);
  }
}

module.exports = allowedOrigins;
