// Central API configuration
// Automatically connects to localhost:5000 in development, and your live Render backend in production
export const API_BASE_URL = (() => {
  // If running in browser on a deployed host (e.g. *.vercel.app or production domain)
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.startsWith('192.168.') &&
    !window.location.hostname.startsWith('10.')
  ) {
    const envUrl = process.env.REACT_APP_API_URL;
    // Only use envUrl if it is a real remote URL, not a local address
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('192.168.')) {
      return envUrl.replace(/\/+$/, '');
    }
    return 'https://fylfly.onrender.com';
  }

  // Local development / testing
  return (
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://fylfly.onrender.com'
      : 'http://localhost:5000')
  ).replace(/\/+$/, '');
})();

