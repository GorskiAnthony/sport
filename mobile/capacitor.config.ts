import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.tournoicenter.mobile',
  appName: 'Tournoi Center',
  webDir: 'www',
  backgroundColor: '#0d1117',
  server: {
    // Par défaut Capacitor sert la WebView Android en https://localhost — un backend de dev en
    // http (le cas courant, pas de certificat local) se fait alors bloquer par la politique
    // "mixed content" du navigateur (page https, requête http refusée). Servir en http évite le
    // problème dans les deux sens : ça n'empêche pas d'appeler un vrai backend https en prod.
    androidScheme: 'http',
  },
};

export default config;
