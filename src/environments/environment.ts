// Production build config. The Dockerfile overwrites `apiBaseUrl` from the
// API_BASE_URL build arg, so this default is only used by a plain `ng build`.
export const environment = {
  apiBaseUrl: 'http://localhost:8000/api/v1',
};
