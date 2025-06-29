export const API_CONFIG = {
  BASE_URL: 'http://localhost:5107'
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 