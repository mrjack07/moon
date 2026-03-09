import type { PhaseInfo } from '@/lib/moonPhase';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { t, getPhaseName } from '@/lib/i18n';
import { formatFullDate } from '@/lib/moonPhase';

interface MoonDisplayProps {
  phaseInfo: PhaseInfo;
}

export function MoonDisplay({ phaseInfo }: MoonDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { language } = useLanguage();
  
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [phaseInfo.phase]);

  // Calculate shadow position based on moon age
  const getShadowStyle = () => {
    const { age } = phaseInfo;
    const cycle = 29.53058867;
    const progress = age / cycle;
    
    // Determine shadow based on phase
    if (progress < 0.5) {
      // Waxing (growing) - shadow on right
      const shadowWidth = (0.5 - progress) * 2 * 100;
      return {
        background: `linear-gradient(to left, 
          rgba(0, 0, 0, 0.88) ${shadowWidth}%, 
          transparent ${shadowWidth}%)`
      };
    } else {
      // Waning (shrinking) - shadow on left
      const shadowWidth = (progress - 0.5) * 2 * 100;
      return {
        background: `linear-gradient(to right, 
          rgba(0, 0, 0, 0.88) ${shadowWidth}%, 
          transparent ${shadowWidth}%)`
      };
    }
  };

  const locale = language === 'es' ? 'es-ES' : 'en-US';

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Moon Container */}
      <div 
        className={`
          relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 
          rounded-full overflow-hidden
          transition-all duration-300 ease-out
          ${isAnimating ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}
        `}
        style={{
          boxShadow: `
            0 0 60px 20px rgba(200, 200, 220, 0.15),
            0 0 100px 40px rgba(200, 200, 220, 0.08),
            inset -20px -20px 60px rgba(0, 0, 0, 0.4)
          `,
          background: `
            radial-gradient(circle at 35% 25%, 
              rgba(250, 250, 252, 0.95) 0%, 
              rgba(230, 230, 235, 0.85) 15%,
              rgba(200, 200, 208, 0.75) 35%,
              rgba(170, 170, 180, 0.65) 55%,
              rgba(140, 140, 155, 0.55) 75%,
              rgba(110, 110, 125, 0.5) 100%
            )
          `
        }}
      >
        {/* Base surface texture - rough lunar terrain */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse 120% 80% at 20% 30%, rgba(160, 160, 170, 0.5) 0%, transparent 40%),
              radial-gradient(ellipse 100% 90% at 70% 60%, rgba(150, 150, 160, 0.4) 0%, transparent 35%),
              radial-gradient(ellipse 80% 100% at 50% 80%, rgba(140, 140, 150, 0.45) 0%, transparent 30%),
              radial-gradient(ellipse 90% 70% at 85% 25%, rgba(155, 155, 165, 0.35) 0%, transparent 25%)
            `
          }}
        />

        {/* Maria (dark plains) - large dark areas */}
        <div 
          className="absolute inset-0 opacity-25"
          style={{
            background: `
              radial-gradient(ellipse 35% 25% at 25% 35%, rgba(80, 80, 95, 0.6) 0%, transparent 70%),
              radial-gradient(ellipse 40% 30% at 65% 55%, rgba(75, 75, 90, 0.55) 0%, transparent 65%),
              radial-gradient(ellipse 30% 35% at 45% 75%, rgba(85, 85, 100, 0.5) 0%, transparent 60%),
              radial-gradient(ellipse 25% 20% at 80% 30%, rgba(70, 70, 85, 0.45) 0%, transparent 55%),
              radial-gradient(ellipse 20% 25% at 15% 70%, rgba(80, 80, 95, 0.4) 0%, transparent 50%)
            `
          }}
        />

        {/* Large craters with depth */}
        <div 
          className="absolute inset-0 opacity-35"
          style={{
            background: `
              /* Tycho-like large crater */
              radial-gradient(circle at 72% 68%, 
                transparent 0%, transparent 6%,
                rgba(60, 60, 75, 0.5) 7%, rgba(80, 80, 95, 0.3) 9%, 
                rgba(100, 100, 115, 0.2) 11%, transparent 13%),
              /* Copernicus-like crater */
              radial-gradient(circle at 35% 28%, 
                transparent 0%, transparent 8%,
                rgba(65, 65, 80, 0.45) 9%, rgba(85, 85, 100, 0.25) 11%, 
                transparent 13%),
              /* Kepler-like crater */
              radial-gradient(circle at 55% 45%, 
                transparent 0%, transparent 5%,
                rgba(70, 70, 85, 0.4) 6%, rgba(90, 90, 105, 0.2) 8%, 
                transparent 10%),
              /* Another large crater */
              radial-gradient(circle at 20% 62%, 
                transparent 0%, transparent 7%,
                rgba(55, 55, 70, 0.5) 8%, rgba(75, 75, 90, 0.3) 10%, 
                transparent 12%),
              /* Crater with rays */
              radial-gradient(circle at 85% 40%, 
                transparent 0%, transparent 4%,
                rgba(60, 60, 75, 0.55) 5%, rgba(80, 80, 95, 0.3) 7%, 
                transparent 9%)
            `
          }}
        />

        {/* Medium craters */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(circle at 15% 25%, rgba(90, 90, 105, 0.5) 3%, transparent 5%),
              radial-gradient(circle at 45% 18%, rgba(85, 85, 100, 0.45) 2.5%, transparent 4%),
              radial-gradient(circle at 78% 35%, rgba(95, 95, 110, 0.4) 3%, transparent 5%),
              radial-gradient(circle at 62% 22%, rgba(80, 80, 95, 0.5) 2%, transparent 3.5%),
              radial-gradient(circle at 28% 52%, rgba(88, 88, 103, 0.45) 2.5%, transparent 4%),
              radial-gradient(circle at 88% 58%, rgba(92, 92, 107, 0.4) 3%, transparent 5%),
              radial-gradient(circle at 42% 68%, rgba(75, 75, 90, 0.5) 2%, transparent 3.5%),
              radial-gradient(circle at 58% 82%, rgba(85, 85, 100, 0.45) 2.5%, transparent 4%),
              radial-gradient(circle at 12% 85%, rgba(90, 90, 105, 0.4) 3%, transparent 5%),
              radial-gradient(circle at 92% 18%, rgba(80, 80, 95, 0.5) 2%, transparent 3.5%),
              radial-gradient(circle at 33% 88%, rgba(88, 88, 103, 0.45) 2.5%, transparent 4%),
              radial-gradient(circle at 68% 38%, rgba(82, 82, 97, 0.4) 2%, transparent 3.5%)
            `
          }}
        />

        {/* Small craters - scattered across surface */}
        <div 
          className="absolute inset-0 opacity-25"
          style={{
            background: `
              radial-gradient(circle at 8% 15%, rgba(100, 100, 115, 0.4) 1%, transparent 2%),
              radial-gradient(circle at 22% 8%, rgba(95, 95, 110, 0.35) 1.2%, transparent 2%),
              radial-gradient(circle at 38% 12%, rgba(105, 105, 120, 0.3) 0.8%, transparent 1.5%),
              radial-gradient(circle at 52% 8%, rgba(90, 90, 105, 0.4) 1%, transparent 2%),
              radial-gradient(circle at 68% 12%, rgba(100, 100, 115, 0.35) 1.2%, transparent 2%),
              radial-gradient(circle at 82% 8%, rgba(95, 95, 110, 0.3) 0.8%, transparent 1.5%),
              radial-gradient(circle at 95% 22%, rgba(105, 105, 120, 0.4) 1%, transparent 2%),
              radial-gradient(circle at 8% 38%, rgba(85, 85, 100, 0.35) 1.2%, transparent 2%),
              radial-gradient(circle at 95% 48%, rgba(100, 100, 115, 0.3) 0.8%, transparent 1.5%),
              radial-gradient(circle at 5% 58%, rgba(90, 90, 105, 0.4) 1%, transparent 2%),
              radial-gradient(circle at 95% 68%, rgba(95, 95, 110, 0.35) 1.2%, transparent 2%),
              radial-gradient(circle at 8% 78%, rgba(105, 105, 120, 0.3) 0.8%, transparent 1.5%),
              radial-gradient(circle at 95% 85%, rgba(85, 85, 100, 0.4) 1%, transparent 2%),
              radial-gradient(circle at 22% 95%, rgba(100, 100, 115, 0.35) 1.2%, transparent 2%),
              radial-gradient(circle at 48% 92%, rgba(90, 90, 105, 0.3) 0.8%, transparent 1.5%),
              radial-gradient(circle at 72% 95%, rgba(95, 95, 110, 0.4) 1%, transparent 2%),
              radial-gradient(circle at 88% 92%, rgba(105, 105, 120, 0.35) 1.2%, transparent 2%),
              radial-gradient(circle at 18% 42%, rgba(85, 85, 100, 0.3) 0.8%, transparent 1.5%),
              radial-gradient(circle at 48% 32%, rgba(100, 100, 115, 0.4) 1%, transparent 2%),
              radial-gradient(circle at 75% 48%, rgba(90, 90, 105, 0.35) 1.2%, transparent 2%),
              radial-gradient(circle at 25% 75%, rgba(95, 95, 110, 0.3) 0.8%, transparent 1.5%),
              radial-gradient(circle at 82% 78%, rgba(85, 85, 100, 0.4) 1%, transparent 2%),
              radial-gradient(circle at 38% 58%, rgba(100, 100, 115, 0.35) 1.2%, transparent 2%),
              radial-gradient(circle at 62% 72%, rgba(90, 90, 105, 0.3) 0.8%, transparent 1.5%)
            `
          }}
        />

        {/* Tiny micro-craters and surface roughness */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 12% 18%, rgba(110, 110, 125, 0.3) 0.3%, transparent 0.6%),
              radial-gradient(circle at 28% 22%, rgba(105, 105, 120, 0.25) 0.4%, transparent 0.8%),
              radial-gradient(circle at 42% 28%, rgba(115, 115, 130, 0.2) 0.3%, transparent 0.6%),
              radial-gradient(circle at 58% 18%, rgba(100, 100, 115, 0.3) 0.4%, transparent 0.8%),
              radial-gradient(circle at 72% 25%, rgba(110, 110, 125, 0.25) 0.3%, transparent 0.6%),
              radial-gradient(circle at 88% 15%, rgba(105, 105, 120, 0.2) 0.4%, transparent 0.8%),
              radial-gradient(circle at 15% 35%, rgba(115, 115, 130, 0.3) 0.3%, transparent 0.6%),
              radial-gradient(circle at 35% 38%, rgba(100, 100, 115, 0.25) 0.4%, transparent 0.8%),
              radial-gradient(circle at 55% 32%, rgba(110, 110, 125, 0.2) 0.3%, transparent 0.6%),
              radial-gradient(circle at 78% 42%, rgba(105, 105, 120, 0.3) 0.4%, transparent 0.8%),
              radial-gradient(circle at 92% 35%, rgba(115, 115, 130, 0.25) 0.3%, transparent 0.6%),
              radial-gradient(circle at 8% 52%, rgba(100, 100, 115, 0.2) 0.4%, transparent 0.8%),
              radial-gradient(circle at 25% 48%, rgba(110, 110, 125, 0.3) 0.3%, transparent 0.6%),
              radial-gradient(circle at 48% 52%, rgba(105, 105, 120, 0.25) 0.4%, transparent 0.8%),
              radial-gradient(circle at 68% 48%, rgba(115, 115, 130, 0.2) 0.3%, transparent 0.6%),
              radial-gradient(circle at 85% 55%, rgba(100, 100, 115, 0.3) 0.4%, transparent 0.8%),
              radial-gradient(circle at 18% 68%, rgba(110, 110, 125, 0.25) 0.3%, transparent 0.6%),
              radial-gradient(circle at 38% 72%, rgba(105, 105, 120, 0.2) 0.4%, transparent 0.8%),
              radial-gradient(circle at 58% 65%, rgba(115, 115, 130, 0.3) 0.3%, transparent 0.6%),
              radial-gradient(circle at 78% 72%, rgba(100, 100, 115, 0.25) 0.4%, transparent 0.8%),
              radial-gradient(circle at 92% 62%, rgba(110, 110, 125, 0.2) 0.3%, transparent 0.6%),
              radial-gradient(circle at 12% 82%, rgba(105, 105, 120, 0.3) 0.4%, transparent 0.8%),
              radial-gradient(circle at 32% 88%, rgba(115, 115, 130, 0.25) 0.3%, transparent 0.6%),
              radial-gradient(circle at 52% 85%, rgba(100, 100, 115, 0.2) 0.4%, transparent 0.8%),
              radial-gradient(circle at 72% 88%, rgba(110, 110, 125, 0.3) 0.3%, transparent 0.6%),
              radial-gradient(circle at 88% 82%, rgba(105, 105, 120, 0.25) 0.4%, transparent 0.8%),
              radial-gradient(circle at 42% 8%, rgba(115, 115, 130, 0.2) 0.3%, transparent 0.6%),
              radial-gradient(circle at 62% 5%, rgba(100, 100, 115, 0.3) 0.4%, transparent 0.8%),
              radial-gradient(circle at 5% 92%, rgba(110, 110, 125, 0.25) 0.3%, transparent 0.6%),
              radial-gradient(circle at 95% 95%, rgba(105, 105, 120, 0.2) 0.4%, transparent 0.8%)
            `
          }}
        />

        {/* Surface ridges and elevation lines */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            background: `
              linear-gradient(45deg, transparent 48%, rgba(120, 120, 135, 0.15) 49%, transparent 50%),
              linear-gradient(-30deg, transparent 45%, rgba(110, 110, 125, 0.12) 48%, transparent 51%),
              linear-gradient(60deg, transparent 47%, rgba(115, 115, 130, 0.1) 49%, transparent 51%),
              linear-gradient(-60deg, transparent 46%, rgba(125, 125, 140, 0.13) 49%, transparent 52%)
            `,
            backgroundSize: '80px 80px, 120px 100px, 60px 70px, 100px 90px'
          }}
        />
        
        {/* Phase shadow overlay */}
        <div 
          className="absolute inset-0 transition-all duration-500"
          style={getShadowStyle()}
        />
        
        {/* Inner glow for depth */}
        <div 
          className="absolute inset-0"
          style={{
            boxShadow: `
              inset 0 0 100px rgba(0, 0, 0, 0.25),
              inset -30px -30px 80px rgba(0, 0, 0, 0.2)
            `
          }}
        />

        {/* Subtle outer rim light */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: 'inset 2px 2px 8px rgba(255, 255, 255, 0.15)'
          }}
        />
      </div>
      
      {/* Phase Name */}
      <h2 
        className={`
          mt-8 text-3xl sm:text-4xl md:text-5xl font-light text-white/90
          tracking-wide transition-all duration-300
          ${isAnimating ? 'opacity-50 translate-y-2' : 'opacity-100 translate-y-0'}
        `}
      >
        {getPhaseName(phaseInfo.phase, language)}
      </h2>
      
      {/* Date */}
      <p className="mt-3 text-base sm:text-lg text-white/50 font-light">
        {formatFullDate(phaseInfo.date, locale)}
      </p>
      
      {/* Illumination percentage */}
      <div className="mt-4 flex items-center gap-2 text-white/40 text-sm">
        <span>{t('moon.illumination', language)}:</span>
        <span className="text-white/60 font-medium">
          {phaseInfo.illumination.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
