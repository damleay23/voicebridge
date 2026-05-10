import { Home, Target, ClipboardCheck, Hand, Trophy, History } from 'lucide-react';
import { motion } from 'motion/react';
import { TabId } from '../App';

export type DockTab = 'home' | 'history' | 'achievements';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  activeDock: DockTab;
  onDockChange: (dock: DockTab) => void;
}

export default function Sidebar({ activeTab, onTabChange, activeDock, onDockChange }: SidebarProps) {
  const menuItems: { id: TabId; icon: any; title: string; subtitle: string }[] = [
    { id: 'aprender', icon: Home,          title: 'Learn',    subtitle: 'Learn the alphabet' },
    { id: 'practica', icon: Target,        title: 'Practice', subtitle: 'Practice the letters' },
    { id: 'examen',   icon: ClipboardCheck,title: 'Exam',     subtitle: 'Test your knowledge' },
    { id: 'libre',    icon: Hand,          title: 'Free',     subtitle: 'Detect any letter' },
  ];

  const dockItems: { id: DockTab; icon: any; label: string }[] = [
    { id: 'home',         icon: Home,    label: 'Home' },
    { id: 'history',      icon: History, label: 'History' },
    { id: 'achievements', icon: Trophy,  label: 'Achievements' },
  ];

  return (
    <div className="w-80 h-full flex flex-col p-6 space-y-8 bg-black/20 border-r border-white/5 overflow-y-auto">
      {/* Logo */}
      <div className="flex flex-col items-center space-y-2 cursor-pointer group">
        <div className="flex items-center justify-center w-full">
          <img
            src="/logo1.png"
            alt="Chakana Space"
            className="w-16 h-16 object-contain group-hover:scale-105 transition-transform"
          />
          <img
            src="/logo2.png"
            alt="VoiceBridge"
            className="h-12 object-contain group-hover:scale-105 transition-transform"
          />
        </div>
        <p className="text-[10px] text-slate-500 font-medium text-center">Learn sign language intelligently with AI</p>
      </div>

      {/* Menu Cards */}
      <div className="flex flex-col space-y-4">
        {menuItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange(item.id)}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
              item.id === activeTab
                ? 'bg-brand-blue/10 border-brand-blue/50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]'
                : 'bg-bg-card/50 border-white/5 hover:border-white/20'
            }`}
          >
            {item.id === activeTab && (
              <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/10 to-transparent pointer-events-none" />
            )}
            <div className="flex items-center space-x-4">
              <div className={`p-2.5 rounded-xl ${item.id === activeTab ? 'bg-brand-blue text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
                <item.icon size={20} />
              </div>
              <div className="flex flex-col">
                <span className={`font-semibold ${item.id === activeTab ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{item.title}</span>
                <span className="text-xs text-slate-500 font-medium">{item.subtitle}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Dock Area */}
      <div className="mt-auto pt-6 flex items-center justify-between px-2">
        {dockItems.map(d => (
          <NavButton
            key={d.id}
            icon={d.icon}
            label={d.label}
            active={activeDock === d.id}
            onClick={() => onDockChange(d.id)}
          />
        ))}
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="flex flex-col items-center space-y-1 group"
    >
      <div className={`p-2 rounded-xl transition-colors ${active ? 'text-brand-blue bg-brand-blue/10' : 'text-slate-500 group-hover:text-slate-300'}`}>
        <Icon size={20} />
      </div>
      <span className={`text-[10px] font-medium ${active ? 'text-brand-blue' : 'text-slate-500 group-hover:text-slate-300'}`}>{label}</span>
      {active && <motion.div layoutId="dock-indicator" className="w-1 h-1 bg-brand-blue rounded-full" />}
    </motion.button>
  );
}
