import { GraduationCap, Target, ClipboardCheck, Hand, Trophy, History } from 'lucide-react';
import { TabId } from '../App';
import { DockTab } from './Sidebar';

const MODE_LABELS: Record<TabId, { label: string; icon: any }> = {
  aprender: { label: 'Learning',  icon: GraduationCap },
  practica: { label: 'Practice',  icon: Target },
  examen:   { label: 'Exam',      icon: ClipboardCheck },
  libre:    { label: 'Free',      icon: Hand },
};

const DOCK_LABELS: Record<DockTab, { label: string; icon: any }> = {
  home:         { label: 'Home',         icon: GraduationCap },
  history:      { label: 'History',      icon: History },
  achievements: { label: 'Achievements', icon: Trophy },
};

export default function Header({ activeTab, activeDock }: { activeTab: TabId; activeDock: DockTab }) {
  const isHome = activeDock === 'home';
  const mode   = isHome ? MODE_LABELS[activeTab] : DOCK_LABELS[activeDock];
  const Icon   = mode.icon;

  return (
    <header className="hidden md:flex items-center h-16 px-8 flex-shrink-0">
      <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
        <Icon size={16} className="text-brand-blue" />
        <span className="text-sm font-medium text-slate-200">
          {isHome ? `Mode: ${mode.label}` : mode.label}
        </span>
      </div>
    </header>
  );
}
