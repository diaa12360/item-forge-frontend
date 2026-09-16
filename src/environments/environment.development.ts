// Same-origin path: `ng serve` proxies /api to the backend (proxy.conf.json),
// so the browser never makes a cross-origin request and CORS doesn't apply,
// whatever port the dev server lands on.
export const environment = {
  apiBaseUrl: '/api/v1',
};
