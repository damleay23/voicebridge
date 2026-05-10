// Banco de palabras por longitud
// Solo se usan letras que el usuario haya desbloqueado en Aprender
// Las palabras están en mayúsculas para coincidir con el abecedario

export const WORD_BANK = [
  'CAT', 'DOG', 'SUN', 'MAP', 'RUN',
  'FLY', 'BOX', 'CUP', 'HAT', 'JAM',
  'KEY', 'LOG', 'MUD', 'NET', 'OAK',
  'PIG', 'RAT', 'SAP', 'TAN', 'VAN',
  'WAX', 'YAM', 'ZIP', 'ARM', 'BED',
  'COB', 'DEN', 'EGG', 'FAN', 'GUM',
  'HOP', 'INK', 'JOT', 'KIT', 'LAP',
  'MOB', 'NUT', 'ODD', 'PAD', 'RIB',
  'SOB', 'TAB', 'URN', 'VET', 'WIG',
  'YEW', 'ZAP',
  'BIRD', 'CAKE', 'DARK', 'EDGE', 'FARM',
  'GOLD', 'HAND', 'IRON', 'JUMP', 'KING',
  'LAMP', 'MINT', 'NAVY', 'OPEN', 'PARK',
  'QUIZ', 'ROAD', 'SALT', 'TREE', 'UNIT',
  'VINE', 'WALK', 'YARN', 'ZERO', 'BAND',
  'CAMP', 'DESK', 'FILM', 'GLOW', 'HINT',
  'JADE', 'KNOT', 'LACE', 'MIST', 'NOON',
  'OVAL', 'PINE', 'RACK', 'SILK', 'TIDE',
  'UPON', 'VAST', 'WORM', 'YOLK', 'ZINC',
];

/**
 * Filtra palabras que solo usen letras desbloqueadas
 * y devuelve N palabras aleatorias
 */
export function getRandomWords(unlockedLetters: string[], count: number): string[] {
  const available = WORD_BANK.filter(word =>
    word.split('').every(l => unlockedLetters.includes(l))
  );

  if (available.length === 0) return [];

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
