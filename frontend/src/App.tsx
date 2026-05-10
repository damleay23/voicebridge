/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Sidebar, { DockTab } from './components/Sidebar';
import Header from './components/Header';
import CameraView from './components/CameraView';
import ControlPanel from './components/ControlPanel';
import RightPanel from './components/RightPanel';
import AlphabetBar from './components/AlphabetBar';
import PracticaView from './components/PracticaView';
import ExamenView from './components/ExamenView';
import LibreView from './components/LibreView';
import AchievementsView from './components/AchievementsView';
import HistoryView from './components/HistoryView';
import NotificationToast from './components/NotificationToast';
import { LetterProvider } from './context/LetterContext';
import { AnimatePresence, motion } from 'motion/react';

export type TabId = 'aprender' | 'practica' | 'examen' | 'libre';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('aprender');
  const [activeDock, setActiveDock] = useState<DockTab>('home');

  const handleDockChange = (dock: DockTab) => {
    setActiveDock(dock);
    // When going back to home, reset to learn tab
    if (dock === 'home') setActiveTab('aprender');
  };

  const showMainContent = activeDock === 'home';

  return (
    <LetterProvider>
      <div className="flex h-screen bg-bg-dark text-slate-200 font-sans overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => { setActiveTab(tab); setActiveDock('home'); }}
          activeDock={activeDock}
          onDockChange={handleDockChange}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <Header activeTab={activeTab} activeDock={activeDock} />

          <AnimatePresence mode="wait">
            {/* Achievements */}
            {activeDock === 'achievements' && (
              <motion.div key="achievements"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} className="flex-1 min-h-0 overflow-hidden">
                <AchievementsView />
              </motion.div>
            )}

            {/* History */}
            {activeDock === 'history' && (
              <motion.div key="history"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} className="flex-1 min-h-0 overflow-hidden">
                <HistoryView />
              </motion.div>
            )}

            {/* Main tabs */}
            {showMainContent && activeTab === 'aprender' && (
              <motion.div key="aprender"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex px-8 pb-0 space-x-6 min-h-0 overflow-hidden">
                  <div className="flex-1 flex flex-col space-y-6 min-h-0">
                    <CameraView />
                    <ControlPanel />
                  </div>
                  <RightPanel />
                </div>
                <AlphabetBar />
              </motion.div>
            )}

            {showMainContent && activeTab === 'practica' && (
              <motion.div key="practica"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} className="flex-1 min-h-0">
                <PracticaView />
              </motion.div>
            )}

            {showMainContent && activeTab === 'examen' && (
              <motion.div key="examen"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} className="flex-1 min-h-0">
                <ExamenView />
              </motion.div>
            )}

            {showMainContent && activeTab === 'libre' && (
              <motion.div key="libre"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} className="flex-1 min-h-0">
                <LibreView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Notification toasts */}
        <NotificationToast />

        {/* Background Glows */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-50 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/[0.03] rounded-full blur-[150px]" />
        </div>
      </div>
    </LetterProvider>
  );
}
