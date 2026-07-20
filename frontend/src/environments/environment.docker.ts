export const environment = {
  production: true,
  // Relative path: nginx proxies /api/* to the backend container on the
  // same Docker network (see nginx.conf). No absolute backend URL needed,
  // so the same built image works behind any domain without a rebuild.
  apiUrl: '/api',
  // Fill in from your EmailJS dashboard (dashboard.emailjs.com) to enable password-reset emails.
  // The EmailJS template must define {{to_email}} and {{reset_link}} variables.
  emailJs: { serviceId: '', templateId: '', publicKey: '' },
};
