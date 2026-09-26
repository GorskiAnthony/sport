export const environment = {
  production: true,
  // Chemin relatif : nginx proxifie /api/* vers le conteneur backend sur le même réseau Docker
  // (voir nginx.conf), pas besoin de baker une URL de backend absolue dans le build web — même
  // image utilisable derrière n'importe quel domaine sans rebuild (voir frontend/environment.docker.ts).
  apiUrl: '/api',
};
