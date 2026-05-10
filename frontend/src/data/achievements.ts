export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;       // emoji
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  completedLetters: string[];
  xp: number;
  streak: number;
  examsCompleted: number;
  examsPerfect: number;   // exams with 100% score
}

export const ACHIEVEMENTS: Achievement[] = [
  // Letters unlocked
  { id: 'first_letter',   title: 'First Sign',       description: 'Unlock your first letter',         icon: '✋', rarity: 'common',    check: s => s.completedLetters.length >= 1 },
  { id: 'five_letters',   title: 'Hand Full',         description: 'Unlock 5 letters',                 icon: '🖐️', rarity: 'common',    check: s => s.completedLetters.length >= 5 },
  { id: 'ten_letters',    title: 'Double Digits',     description: 'Unlock 10 letters',                icon: '👐', rarity: 'rare',      check: s => s.completedLetters.length >= 10 },
  { id: 'twenty_letters', title: 'Almost There',      description: 'Unlock 20 letters',                icon: '🙌', rarity: 'epic',      check: s => s.completedLetters.length >= 20 },
  { id: 'all_letters',    title: 'Master Signer',     description: 'Unlock all 26 letters',            icon: '🏆', rarity: 'legendary', check: s => s.completedLetters.length >= 26 },
  // XP
  { id: 'xp_100',         title: 'Getting Started',   description: 'Earn 100 XP',                      icon: '⭐', rarity: 'common',    check: s => s.xp >= 100 },
  { id: 'xp_500',         title: 'On a Roll',         description: 'Earn 500 XP',                      icon: '🌟', rarity: 'rare',      check: s => s.xp >= 500 },
  { id: 'xp_1000',        title: 'XP Hunter',         description: 'Earn 1,000 XP',                    icon: '💫', rarity: 'epic',      check: s => s.xp >= 1000 },
  { id: 'xp_5000',        title: 'Legend',            description: 'Earn 5,000 XP',                    icon: '🔥', rarity: 'legendary', check: s => s.xp >= 5000 },
  // Streak
  { id: 'streak_5',       title: 'Hot Streak',        description: 'Complete 5 letters in a row',      icon: '🔥', rarity: 'common',    check: s => s.streak >= 5 },
  { id: 'streak_10',      title: 'On Fire',           description: 'Complete 10 letters in a row',     icon: '🌋', rarity: 'rare',      check: s => s.streak >= 10 },
  // Exams
  { id: 'first_exam',     title: 'Test Taker',        description: 'Complete your first exam',         icon: '📝', rarity: 'common',    check: s => s.examsCompleted >= 1 },
  { id: 'five_exams',     title: 'Exam Pro',          description: 'Complete 5 exams',                 icon: '📚', rarity: 'rare',      check: s => s.examsCompleted >= 5 },
  { id: 'perfect_exam',   title: 'Perfectionist',     description: 'Get 100% on an exam',              icon: '💯', rarity: 'epic',      check: s => s.examsPerfect >= 1 },
  { id: 'three_perfect',  title: 'Flawless',          description: 'Get 100% on 3 exams',              icon: '👑', rarity: 'legendary', check: s => s.examsPerfect >= 3 },
];

export const RARITY_COLORS: Record<Achievement['rarity'], string> = {
  common:    'text-slate-300 border-slate-600  bg-slate-800/50',
  rare:      'text-blue-300  border-blue-500/50 bg-blue-900/30',
  epic:      'text-purple-300 border-purple-500/50 bg-purple-900/30',
  legendary: 'text-yellow-300 border-yellow-500/50 bg-yellow-900/30',
};
