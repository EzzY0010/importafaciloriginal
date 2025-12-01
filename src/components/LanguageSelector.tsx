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
        variant={language === 'zh' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLanguage('zh')}
        className="text-xs px-3"
      >
        🇨🇳 中文
      </Button>
    </div>
  );
};

export default LanguageSelector;
