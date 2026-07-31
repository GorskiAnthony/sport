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
    // Depuis l'API 28, Android bloque par défaut tout trafic réseau (natif ou WebView) non-HTTPS,
    // indépendamment de androidScheme ci-dessus — sans ça, un backend de dev en http renvoie
    // ERR_CLEARTEXT_NOT_PERMITTED. Voir aussi android/app/src/debug/ (network security config,
    // qui couvre en plus les requêtes natives des plugins Capacitor hors WebView).
    cleartext: true,
  },
};

export default config;
