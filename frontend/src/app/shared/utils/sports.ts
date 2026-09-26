export interface SportOption {
  id: string;
  label: string;
  icon: string;
  /** Phrase courte utilisée sur /sports (SEO longue traîne) : décrit le contexte de tournoi
   *  propre à ce sport, pas une fonctionnalité Matchday spécifique (le moteur de formats est
   *  générique, pas adapté sport par sport). */
  description: string;
}

export const SPORTS: SportOption[] = [
  { id: 'football', label: 'Football', icon: '⚽', description: 'Tournois à 5, 7 ou 11, entre amis, en entreprise ou en club : poules, élimination directe ou format mixte.' },
  { id: 'futsal', label: 'Futsal', icon: '🥅', description: "Format court et matchs rapides en salle, idéal pour un city stade ou un gymnase." },
  { id: 'basketball', label: 'Basketball', icon: '🏀', description: 'Tournois en 3x3 ou 5x5, en poules ou en élimination directe, classement mis à jour à chaque match.' },
  { id: 'handball', label: 'Handball', icon: '🤾', description: 'Tournois entre clubs ou équipes amateurs, calendrier multi-terrains et scores en direct.' },
  { id: 'volleyball', label: 'Volleyball', icon: '🏐', description: 'Poules puis phase finale, en salle ou en beach-volley.' },
  { id: 'rugby', label: 'Rugby', icon: '🏉', description: 'Tournois à 7 ou à XV, du tournoi de plage au tournoi de club.' },
  { id: 'tennis', label: 'Tennis', icon: '🎾', description: 'Tableaux à élimination directe en simple ou double, score du match suivi en direct.' },
  { id: 'tennis_de_table', label: 'Tennis de table', icon: '🏓', description: 'Poules ou tableau à élimination directe, pour clubs ou compétitions amateurs.' },
  { id: 'badminton', label: 'Badminton', icon: '🏸', description: 'Simple ou double, en poules ou en élimination directe.' },
  { id: 'esport', label: 'Esport', icon: '🎮', description: 'Tournois FIFA, Rocket League, Valorant... avec bracket et classement suivis en direct par les joueurs et le public.' },
  { id: 'flechettes', label: 'Fléchettes', icon: '🎯', description: 'Tournois entre amis ou en club, en poules ou en élimination directe.' },
  { id: 'petanque', label: 'Pétanque', icon: '🟤', description: 'Concours en doublette ou triplette : poules puis élimination directe, comme un concours officiel.' },
  { id: 'natation', label: 'Natation', icon: '🏊', description: "Compétitions par équipes, classement centralisé épreuve par épreuve." },
  { id: 'athletisme', label: 'Athlétisme', icon: '🏃', description: "Compétitions par équipes ou meeting amateur, classements centralisés." },
  { id: 'boxe', label: 'Boxe', icon: '🥊', description: 'Tournois amateurs en phases à élimination directe, calendrier des combats.' },
  { id: 'judo', label: 'Judo', icon: '🥋', description: 'Tournois par catégories de poids, en poules ou en tableau à élimination directe.' },
  { id: 'cyclisme', label: 'Cyclisme', icon: '🚴', description: "Épreuves par équipes, classement général mis à jour au fil des étapes." },
  { id: 'golf', label: 'Golf', icon: '⛳', description: 'Compétitions par équipes ou en scramble, classement centralisé.' },
  { id: 'baseball', label: 'Baseball', icon: '⚾', description: 'Poules ou élimination directe, pour ligues amateurs et clubs.' },
  { id: 'cricket', label: 'Cricket', icon: '🏏', description: 'Tournois entre équipes amateurs, calendrier de matchs et classement.' },
  { id: 'hockey', label: 'Hockey', icon: '🏒', description: 'Gazon ou salle : poules puis phase finale, entre clubs amateurs.' },
  { id: 'escalade', label: 'Escalade', icon: '🧗', description: 'Compétitions par équipes, classement basé sur les résultats de chaque bloc ou voie.' },
];
