import { useState, useEffect, useCallback } from 'react';
import { MoonDisplay } from '@/components/MoonDisplay';
import { Timeline } from '@/components/Timeline';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { calculateMoonPhase, getTimelinePhases, type PhaseInfo } from '@/lib/moonPhase';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageProvider, useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';

function AppContent() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentPhase, setCurrentPhase] = useState<PhaseInfo | null>(null);
  const [timelinePhases, setTimelinePhases] = useState<PhaseInfo[]>([]);
  const [isCurrentDate, setIsCurrentDate] = useState(true);
  const { language } = useLanguage();

  // Update phases when selected date changes
  useEffect(() => {
    const phase = calculateMoonPhase(selectedDate);
    setCurrentPhase(phase);
    setTimelinePhases(getTimelinePhases(selectedDate));
    
    // Check if selected date is today
    const today = new Date();
    setIsCurrentDate(selectedDate.toDateString() === today.toDateString());
  }, [selectedDate]);

  // Handle phase selection from timeline
  const handleSelectPhase = useCallback((phase: PhaseInfo) => {
    setSelectedDate(phase.date);
  }, []);

  // Reset to current date
  const handleReset = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  // Update current time every minute to keep "Today" accurate
  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date();
      if (selectedDate.toDateString() === today.toDateString()) {
        setSelectedDate(new Date());
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [selectedDate]);

  if (!currentPhase) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Background stars effect */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at top, rgba(30, 30, 50, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at bottom, rgba(20, 20, 35, 0.2) 0%, transparent 50%)
          `
        }}
      >
        {/* Random stars */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.2,
              animation: `twinkle ${Math.random() * 3 + 2}s infinite`
            }}
          />
        ))}
      </div>

      {/* Header with reset button and language switcher */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🌙</span>
          <h1 className="text-lg sm:text-xl font-light text-white/80 tracking-wide">
            {t('app.title', language)}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isCurrentDate}
            className={`
              flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/10
              transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed
              text-sm sm:text-base
            `}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">{t('app.reset', language)}</span>
            <span className="sm:hidden">{t('app.reset.short', language)}</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* Timeline at top */}
        <div className="w-full max-w-4xl mx-auto pt-2 sm:pt-4">
          <Timeline 
            phases={timelinePhases}
            selectedDate={selectedDate}
            onSelectPhase={handleSelectPhase}
          />
        </div>

        {/* Moon display - main portion */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
          <MoonDisplay phaseInfo={currentPhase} />
        </div>

        {/* Footer info */}
        <div className="px-4 pb-6 text-center">
          <p className="text-white/30 text-xs sm:text-sm">
            {t('app.footer.hint', language)}
          </p>
        </div>
      </main>

      {/* CSS for star twinkle animation */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
