import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

interface ExchangeRates {
  USD: number;
  EUR: number;
  BRL: number;
}

const ImportCalculator: React.FC = () => {
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1, EUR: 0.92, BRL: 5.80 });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'BRL'>('USD');
  const [productValue, setProductValue] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<string>('');
  const [declaredValue, setDeclaredValue] = useState<string>('');

  const fetchRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setRates({
        USD: 1,
        EUR: data.rates.EUR,
        BRL: data.rates.BRL
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 3000);
    return () => clearInterval(interval);
  }, []);

  const convertToUSD = (value: number, fromCurrency: string): number => {
    if (fromCurrency === 'USD') return value;
    if (fromCurrency === 'EUR') return value / rates.EUR;
    if (fromCurrency === 'BRL') return value / rates.BRL;
    return value;
  };

  const product = parseFloat(productValue) || 0;
  const shipping = parseFloat(shippingCost) || 0;
  const declared = parseFloat(declaredValue) || 0;
  
  // Convert everything to BRL for display
  const productInUSD = convertToUSD(product, currency);
  const shippingInUSD = convertToUSD(shipping, currency);
  const declaredInUSD = convertToUSD(declared, currency);
  
  const productInBRL = productInUSD * rates.BRL;
  const shippingInBRL = shippingInUSD * rates.BRL;
  const declaredInBRL = declaredInUSD * rates.BRL;
  
  // Tax is 60% of DECLARED value only
  const taxBRL = declaredInBRL * 0.60;
  const totalCostBRL = productInBRL + shippingInBRL + taxBRL;

  // Calculate EUR to BRL rate correctly (how many BRL for 1 EUR)
  const eurToBrl = rates.BRL / rates.EUR;

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', BRL: 'R$' };
    return symbols[curr];
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📊 Calculadora de Importação</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Atualizado: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exchange Rates Display */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            1 USD = R$ {rates.BRL.toFixed(2)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            1 EUR = R$ {eurToBrl.toFixed(2)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            1 USD = € {rates.EUR.toFixed(2)}
          </Badge>
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <Label>Moeda</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as 'USD' | 'EUR' | 'BRL')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">🇺🇸 Dólar (USD)</SelectItem>
              <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
              <SelectItem value="BRL">🇧🇷 Real (BRL)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Value */}
        <div className="space-y-2">
          <Label>Valor do Produto ({getCurrencySymbol(currency)})</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={productValue}
            onChange={(e) => setProductValue(e.target.value)}
          />
        </div>

        {/* Shipping Cost */}
        <div className="space-y-2">
          <Label>Frete ({getCurrencySymbol(currency)})</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={shippingCost}
            onChange={(e) => setShippingCost(e.target.value)}
          />
        </div>

        {/* Declared Value */}
        <div className="space-y-2">
          <Label>Declaração ({getCurrencySymbol(currency)})</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={declaredValue}
            onChange={(e) => setDeclaredValue(e.target.value)}
          />
        </div>

        {/* Results */}
        <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
          <h3 className="font-semibold text-lg">Resumo dos Custos</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Valor do Produto:</span>
              <span>R$ {productInBRL.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Frete:</span>
              <span>R$ {shippingInBRL.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Declaração:</span>
              <span>R$ {declaredInBRL.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Imposto (60% da declaração):</span>
              <span>R$ {taxBRL.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>CUSTO TOTAL:</span>
              <span className="text-primary">R$ {totalCostBRL.toFixed(2)}</span>
            </div>
          </div>

          {/* Conversions */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Total em outras moedas:</p>
            <div className="flex gap-3 mt-1">
              <span>$ {(totalCostBRL / rates.BRL).toFixed(2)} USD</span>
              <span>€ {(totalCostBRL / rates.BRL * rates.EUR).toFixed(2)} EUR</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportCalculator;
