// Central API configuration
// Automatically connects to:
// 1. Render backend when hosted on Vercel or production domain
// 2. Local IP (e.g. 192.168.x.x:5000) when testing from mobile on same Wi-Fi
// 3. localhost:5000 when developing locally on laptop
export const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    // Local LAN Wi-Fi testing from mobile devices
    if (
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    ) {
      return `http://${hostname}:5000`;
    }

    // Deployed production environment (e.g. *.vercel.app)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const envUrl = process.env.REACT_APP_API_URL;
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('192.168.')) {
        return envUrl.replace(/\/+$/, '');
      }
      return 'https://fylfly.onrender.com';
    }
  }

  // Local development fallback
  return (
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://fylfly.onrender.com'
      : 'http://localhost:5000')
  ).replace(/\/+$/, '');
})();

