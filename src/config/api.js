// API Configuration
export const API_BASE_URL = 'http://localhost:3000/api';

// You can add other API-related configurations here
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;

// Environment-based configuration
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    
    // Production or other environments
    return `${window.location.protocol}//${hostname}/api`;
  }
  
  // Server-side or default
  return process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
};

export const DYNAMIC_API_BASE_URL = getApiBaseUrl();
