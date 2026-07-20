export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  // Fill in from your EmailJS dashboard (dashboard.emailjs.com) to enable password-reset emails.
  // The EmailJS template must define {{to_email}} and {{reset_link}} variables.
  emailJs: { serviceId: '', templateId: '', publicKey: '' },
};
