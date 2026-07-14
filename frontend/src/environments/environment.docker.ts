export const environment = {
  production: true,
  // Relative path: nginx proxies /api/* to the backend container on the
  // same Docker network (see nginx.conf). No absolute backend URL needed,
  // so the same built image works behind any domain without a rebuild.
  apiUrl: '/api',
};
