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
}

const CURRENCIES = [
  { key: 'EUR' as const, symbol: '€', flag: '🇪🇺', label: 'Euro' },
  { key: 'USD' as const, symbol: '$', flag: '🇺🇸', label: 'Dólar' },
  { key: 'CNY' as const, symbol: '¥', flag: '🇨🇳', label: 'Yuan' },
  { key: 'BRL' as const, symbol: 'R$', flag: '🇧🇷', label: 'Real' },
];

const CurrencyConverter: React.FC = () => {
  const [rates, setRates] = useState<Rates>({ USD: 1, EUR: 0.92, CNY: 7.25, BRL: 5.80 });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [values, setValues] = useState<Record<string, string>>({ EUR: '', USD: '', CNY: '', BRL: '' });
  const [activeCurrency, setActiveCurrency] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setRates({
        USD: 1,
        EUR: data.rates.EUR,
        CNY: data.rates.CNY,
        BRL: data.rates.BRL,
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 10000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const handleChange = (currency: string, rawValue: string) => {
    setActiveCurrency(currency);
    const numValue = parseFloat(rawValue);

    if (!rawValue || isNaN(numValue)) {
      setValues({ EUR: '', USD: '', CNY: '', BRL: '' });
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
    <Card className="w-full max-w-2xl" translate="no">
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
          <Badge variant="outline" className="text-xs font-mono">🇨🇳 1 CNY = R$ {(rates.BRL / rates.CNY).toFixed(2)}</Badge>
        </div>

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
                value={values[c.key]}
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
