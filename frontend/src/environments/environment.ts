export const environment = {
  production: false,
  // Chemin relatif : proxifié vers localhost:3000 par ng serve (voir proxy.conf.json), pour que
  // le navigateur voie du same-origin comme en prod (nginx) — indispensable maintenant que
  // l'auth passe par cookie httpOnly + CSRF, qu'Angular n'envoie jamais en cross-origin (voir
  // HttpXsrfInterceptor, comportement non configurable). Sans ça, toute requête mutante échoue
  // en 403 en dev alors qu'elle fonctionne en prod.
  apiUrl: '/api',
};
