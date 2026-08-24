import { formatDate, formatFullDate, type PhaseInfo } from '@/lib/moonPhase';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { t, getPhaseName } from '@/lib/i18n';

interface TimelineProps {
  phases: PhaseInfo[];
  selectedDate: Date;
  onSelectPhase: (phase: PhaseInfo) => void;
}

export function Timeline({ phases, selectedDate, onSelectPhase }: TimelineProps) {
  const { language } = useLanguage();
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const locale = language === 'es' ? 'es-ES' : 'en-US';

  return (
    <div className="w-full">
      {/* Timeline container */}
      <div className="relative">
        {/* Center indicator line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent transform -translate-x-1/2 z-10" />
        
        {/* Scrollable timeline */}
        <div 
          role="group"
          aria-label={t('a11y.timeline', language)}
          className="flex overflow-x-auto pb-4 pt-2 px-4 gap-3 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {phases.map((phase, index) => {
            const selected = isSelected(phase.date);
            const today = isToday(phase.date);
            
            return (
              <button
                key={index}
                onClick={() => onSelectPhase(phase)}
                // The visible label is a bare "Aug 24" (or "Today") plus an emoji;
                // spell the whole thing out for anyone who cannot see the column.
                aria-label={`${formatFullDate(phase.date, locale)}, ${getPhaseName(phase.phase, language)}`}
                aria-pressed={selected}
                aria-current={today ? 'date' : undefined}
                className={cn(
                  'relative flex-shrink-0 flex flex-col items-center gap-2 px-3 py-3 rounded-xl',
                  'transition-all duration-300 ease-out',
                  'hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                  selected 
                    ? 'bg-white/15 scale-110 shadow-lg shadow-white/5' 
                    : 'bg-white/5 scale-100',
                  today && !selected && 'ring-1 ring-white/30'
                )}
              >
                {/* Date label */}
                <span 
                  className={cn(
                    'text-xs font-medium transition-colors',
                    selected ? 'text-white/90' : 'text-white/50',
                    today && 'text-amber-300/80'
                  )}
                >
                  {today ? t('timeline.today', language) : formatDate(phase.date, locale)}
                </span>
                
                {/* Moon icon */}
                <div 
                  aria-hidden="true"
                  className={cn(
                    'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center',
                    'transition-all duration-300',
                    selected 
                      ? 'bg-white/20 shadow-inner' 
                      : 'bg-white/5'
                  )}
                >
                  <span className="text-2xl sm:text-3xl">{phase.icon}</span>
                </div>
                
                {/* Phase name */}
                <span 
                  className={cn(
                    'text-[10px] sm:text-xs text-center max-w-[70px] sm:max-w-[80px]',
                    'truncate transition-colors',
                    selected ? 'text-white/80' : 'text-white/60'
                  )}
                >
                  {getPhaseName(phase.phase, language)}
                </span>
                
                {/* Today indicator dot */}
                {today && (
                  <div aria-hidden="true" className="absolute -top-1 w-2 h-2 rounded-full bg-amber-400/80" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-[#0a0a0f] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-[#0a0a0f] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
