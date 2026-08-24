import { useLanguage } from '@/hooks/useLanguage';
import { t, type Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  return (
    <div
      role="group"
      aria-label={t('a11y.language', language)}
      className="flex items-center gap-1 bg-white/10 rounded-lg p-1"
    >
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          // The country code is hidden below `sm`, so without this the button
          // would be announced as nothing but a flag emoji on phones.
          aria-label={lang.label}
          aria-pressed={language === lang.code}
          className={cn(
            'px-2 py-1 rounded-md text-sm font-medium transition-all duration-200',
            'hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
            language === lang.code
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:text-white/80'
          )}
          title={lang.label}
        >
          <span className="mr-1" aria-hidden="true">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
