import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ArrowRightLeft } from 'lucide-react';

interface Rates {
  USD: number;
  EUR: number;
  CNY: number;
  BRL: number;
  GBP: number;
  PLN: number;
  JPY: number;
  SAR: number;
  AED: number;
}

const CURRENCIES = [
  { key: 'EUR' as const, symbol: '€', flag: '🇪🇺', label: 'Euro' },
  { key: 'USD' as const, symbol: '$', flag: '🇺🇸', label: 'Dólar' },
  { key: 'GBP' as const, symbol: '£', flag: '🇬🇧', label: 'Libra' },
  { key: 'CNY' as const, symbol: '¥', flag: '🇨🇳', label: 'Yuan' },
  { key: 'PLN' as const, symbol: 'zł', flag: '🇵🇱', label: 'Zloty' },
  { key: 'JPY' as const, symbol: '¥', flag: '🇯🇵', label: 'Iene' },
  { key: 'SAR' as const, symbol: '﷼', flag: '🇸🇦', label: 'Rial' },
  { key: 'AED' as const, symbol: 'د.إ', flag: '🇦🇪', label: 'Dirham' },
  { key: 'BRL' as const, symbol: 'R$', flag: '🇧🇷', label: 'Real' },
];

const CurrencyConverter: React.FC = () => {
  const [rates, setRates] = useState<Rates>({ USD: 1, EUR: 0.92, CNY: 7.25, BRL: 5.80, GBP: 0.79, PLN: 3.95, JPY: 150, SAR: 3.75, AED: 3.67 });
  const [rateError, setRateError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [values, setValues] = useState<Record<string, string>>({} as Record<string, string>);
  const [activeCurrency, setActiveCurrency] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      if (!data?.rates?.BRL) throw new Error('rates');
      setRates({
        USD: 1,
        EUR: data.rates.EUR,
        CNY: data.rates.CNY,
        BRL: data.rates.BRL,
        GBP: data.rates.GBP,
        PLN: data.rates.PLN,
        JPY: data.rates.JPY,
        SAR: data.rates.SAR,
        AED: data.rates.AED,
      });
      setLastUpdate(new Date());
      setRateError(false);
    } catch {
      setRateError(true);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const handleChange = (currency: string, rawValue: string) => {
    setActiveCurrency(currency);
    const numValue = parseFloat(rawValue);

    if (!rawValue || isNaN(numValue)) {
      setValues({} as Record<string, string>);
      return;
    }

    // Convert input to USD first, then to all others
    const inUSD = numValue / rates[currency as keyof Rates];

    const newValues: Record<string, string> = {};
    for (const c of CURRENCIES) {
      if (c.key === currency) {
        newValues[c.key] = rawValue;
      } else {
        newValues[c.key] = (inUSD * rates[c.key]).toFixed(2);
      }
    }
    setValues(newValues);
  };

  return (
    <Card data-tour="converter" className="w-full max-w-2xl" translate="no">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-accent" />
            Conversor de Moedas
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>{lastUpdate.toLocaleTimeString()}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs font-mono">🇺🇸 1 USD = R$ {rates.BRL.toFixed(2)}</Badge>
          <Badge variant="outline" className="text-xs font-mono">🇪🇺 1 EUR = R$ {(rates.BRL / rates.EUR).toFixed(2)}</Badge>
          <Badge variant="outline" className="text-xs font-mono">🇬🇧 1 GBP = R$ {(rates.BRL / rates.GBP).toFixed(2)}</Badge>
          <Badge variant="outline" className="text-xs font-mono">🇨🇳 1 CNY = R$ {(rates.BRL / rates.CNY).toFixed(2)}</Badge>
          <Badge variant="outline" className="text-xs font-mono">🇵🇱 1 PLN = R$ {(rates.BRL / rates.PLN).toFixed(2)}</Badge>
          <Badge variant="outline" className="text-xs font-mono">🇯🇵 1 JPY = R$ {(rates.BRL / rates.JPY).toFixed(3)}</Badge>
          <Badge variant="outline" className="text-xs font-mono">🇸🇦 1 SAR = R$ {(rates.BRL / rates.SAR).toFixed(2)}</Badge>
          <Badge variant="outline" className="text-xs font-mono">🇦🇪 1 AED = R$ {(rates.BRL / rates.AED).toFixed(2)}</Badge>
        </div>
        {rateError && <p className="text-xs text-muted-foreground">⚠️ Não foi possível atualizar a cotação agora. Usando os últimos valores.</p>}

        <div className="grid grid-cols-2 gap-3">
          {CURRENCIES.map((c) => (
            <div key={c.key} className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                {c.flag} {c.label} ({c.symbol})
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={values[c.key] ?? ''}
                onChange={(e) => handleChange(c.key, e.target.value)}
                className={`h-9 text-sm font-medium ${activeCurrency === c.key ? 'ring-2 ring-accent' : ''}`}
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Digite em qualquer campo e os outros atualizam automaticamente
        </p>
      </CardContent>
    </Card>
  );
};

export default CurrencyConverter;
