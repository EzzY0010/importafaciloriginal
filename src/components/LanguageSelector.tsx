import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-2">
      <Button
        variant={language === 'pt' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLanguage('pt')}
        className="text-xs px-3"
      >
        🇧🇷 PT
      </Button>
      <Button
        variant={language === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLanguage('en')}
        className="text-xs px-3"
      >
        🇺🇸 EN
      </Button>
    </div>
  );
};

export default LanguageSelector;
