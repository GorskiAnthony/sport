export interface SportOption {
  id: string;
  label: string;
  icon: string;
}

export const SPORTS: SportOption[] = [
  { id: 'football', label: 'Football', icon: '⚽' },
  { id: 'futsal', label: 'Futsal', icon: '⚽' },
  { id: 'basketball', label: 'Basketball', icon: '🏀' },
  { id: 'handball', label: 'Handball', icon: '🤾' },
  { id: 'volleyball', label: 'Volleyball', icon: '🏐' },
  { id: 'rugby', label: 'Rugby', icon: '🏉' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'tennis_de_table', label: 'Tennis de table', icon: '🏓' },
  { id: 'badminton', label: 'Badminton', icon: '🏸' },
  { id: 'esport', label: 'Esport', icon: '🎮' },
  { id: 'flechettes', label: 'Fléchettes', icon: '🎯' },
  { id: 'petanque', label: 'Pétanque', icon: '🟤' },
  { id: 'natation', label: 'Natation', icon: '🏊' },
  { id: 'athletisme', label: 'Athlétisme', icon: '🏃' },
  { id: 'boxe', label: 'Boxe', icon: '🥊' },
  { id: 'judo', label: 'Judo', icon: '🥋' },
  { id: 'cyclisme', label: 'Cyclisme', icon: '🚴' },
  { id: 'golf', label: 'Golf', icon: '⛳' },
  { id: 'baseball', label: 'Baseball', icon: '⚾' },
  { id: 'cricket', label: 'Cricket', icon: '🏏' },
  { id: 'hockey', label: 'Hockey', icon: '🏒' },
  { id: 'escalade', label: 'Escalade', icon: '🧗' },
];
