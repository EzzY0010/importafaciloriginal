import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, TrendingUp, Plus, Trash2, Package, AlertCircle } from 'lucide-react';

type Currency = 'USD' | 'EUR' | 'CNY';

interface ExchangeRates {
  USD: number;
  EUR: number;
  CNY: number;
  BRL: number;
}

interface ProductItem {
  id: string;
  name: string;
  costPrice: string;
  declaredValue: string;
  profitMargin: string;
  currency: Currency;
}

const CURRENCY_CONFIG = {
  USD: { symbol: '$', flag: '🇺🇸', label: 'Dólar' },
  EUR: { symbol: '€', flag: '🇪🇺', label: 'Euro' },
  CNY: { symbol: '¥', flag: '🇨🇳', label: 'Yuan' },
};

const AdvancedPricingCalculator: React.FC = () => {
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1, EUR: 0.92, CNY: 7.25, BRL: 5.80 });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [totalShipping, setTotalShipping] = useState<string>('');
  const [shippingCurrency, setShippingCurrency] = useState<Currency>('USD');
  const [items, setItems] = useState<ProductItem[]>([
    { id: '1', name: '', costPrice: '', declaredValue: '', profitMargin: '30', currency: 'USD' }
  ]);

  const fetchRates = useCallback(async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setRates({
        USD: 1,
        EUR: data.rates.EUR,
        CNY: data.rates.CNY,
        BRL: data.rates.BRL
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 3000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  // Convert from any currency to BRL
  const convertToBRL = (value: number, fromCurrency: Currency): number => {
    // First convert to USD, then to BRL
    const inUSD = value / rates[fromCurrency];
    return inUSD * rates.BRL;
  };

  const addItem = () => {
    if (items.length >= 10) return;
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      costPrice: '',
      declaredValue: '',
      profitMargin: '30',
      currency: 'USD'
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ProductItem, value: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Calcular frete rateado por item (já convertido para BRL)
  const activeItems = items.filter(item => parseFloat(item.costPrice) > 0);
  const totalShippingValue = parseFloat(totalShipping) || 0;
  const totalShippingBRL = convertToBRL(totalShippingValue, shippingCurrency);
  const shippingPerItemBRL = activeItems.length > 0 
    ? totalShippingBRL / activeItems.length 
    : 0;

  // Calcular cotações para display
  const usdToBrl = rates.BRL;
  const eurToBrl = rates.BRL / rates.EUR;
  const cnyToBrl = rates.BRL / rates.CNY;

  // Cálculos para cada item
  const calculateItemCosts = (item: ProductItem) => {
    const costPrice = parseFloat(item.costPrice) || 0;
    const declaredValue = parseFloat(item.declaredValue) || 0;
    const profitMargin = parseFloat(item.profitMargin) || 0;

    // Converter custo para BRL usando a moeda específica do item
    const costPriceBRL = convertToBRL(costPrice, item.currency);
    
    // Somar frete já rateado em BRL
    const costWithShippingBRL = costPriceBRL + shippingPerItemBRL;
    
    // Converter declaração para BRL e aplicar imposto 60%
    const declaredValueBRL = convertToBRL(declaredValue, item.currency);
    const taxBRL = declaredValueBRL * 0.60;
    
    // Custo Real Final
    const finalCostBRL = costWithShippingBRL + taxBRL;
    
    // Preço de Venda = Custo Real Final * (1 + Margem / 100)
    const sellingPrice = finalCostBRL * (1 + profitMargin / 100);
    
    // Lucro Líquido = Preço de Venda - Custo Real Final
    const netProfit = sellingPrice - finalCostBRL;

    return {
      costPriceBRL,
      costWithShippingBRL,
      declaredValueBRL,
      taxBRL,
      finalCostBRL,
      sellingPrice,
      netProfit
    };
  };

  // Total geral
  const totalResults = items.reduce((acc, item) => {
    const costs = calculateItemCosts(item);
    return {
      totalCost: acc.totalCost + costs.finalCostBRL,
      totalSelling: acc.totalSelling + costs.sellingPrice,
      totalProfit: acc.totalProfit + costs.netProfit
    };
  }, { totalCost: 0, totalSelling: 0, totalProfit: 0 });

  const getCurrencySymbol = (currency: Currency) => CURRENCY_CONFIG[currency].symbol;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Precificação Multimoedas
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>{lastUpdate.toLocaleTimeString()}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exchange Rates - 3 moedas */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs font-mono">
            🇺🇸 1 USD = R$ {usdToBrl.toFixed(2)}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono">
            🇪🇺 1 EUR = R$ {eurToBrl.toFixed(2)}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono">
            🇨🇳 1 CNY = R$ {cnyToBrl.toFixed(2)}
          </Badge>
        </div>

        {/* Total Shipping with Currency Selector */}
        <div className="p-3 bg-muted/50 rounded-xl space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-accent" />
            Frete Total Internacional
          </Label>
          <div className="flex gap-2">
            <Select value={shippingCurrency} onValueChange={(v) => setShippingCurrency(v as Currency)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.flag} {config.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={totalShipping}
              onChange={(e) => setTotalShipping(e.target.value)}
              className="flex-1 text-lg font-medium"
            />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Sugestão: O frete costuma representar entre 10% a 20% do valor dos produtos
          </p>
          {activeItems.length > 1 && shippingPerItemBRL > 0 && (
            <Badge variant="secondary" className="text-xs">
              Rateado: R$ {shippingPerItemBRL.toFixed(2)} por item ({activeItems.length} itens)
            </Badge>
          )}
        </div>

        {/* Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Itens ({items.length}/10)</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addItem}
              disabled={items.length >= 10}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </div>

          {items.map((item, index) => {
            const costs = calculateItemCosts(item);
            const hasData = parseFloat(item.costPrice) > 0;
            const currencySymbol = getCurrencySymbol(item.currency);

            return (
              <div key={item.id} className="p-3 border border-border rounded-xl bg-card space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0 text-xs flex-shrink-0">
                      {index + 1}
                    </Badge>
                    <Input
                      placeholder="Nome do produto"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      className="h-8 text-sm flex-1"
                    />
                    {/* Currency Selector per Item */}
                    <Select 
                      value={item.currency} 
                      onValueChange={(v) => updateItem(item.id, 'currency', v)}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.flag} {config.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {items.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeItem(item.id)}
                      className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Preço Custo ({currencySymbol})
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={item.costPrice}
                      onChange={(e) => updateItem(item.id, 'costPrice', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Declaração ({currencySymbol})
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={item.declaredValue}
                      onChange={(e) => updateItem(item.id, 'declaredValue', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Margem (%)</Label>
                    <Input
                      type="number"
                      step="1"
                      placeholder="30"
                      value={item.profitMargin}
                      onChange={(e) => updateItem(item.id, 'profitMargin', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {hasData && (
                  <div className="pt-2 border-t border-border space-y-1">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Custo+Frete:</span>
                        <p className="font-medium">R$ {costs.costWithShippingBRL.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-destructive">Imposto 60%:</span>
                        <p className="font-medium text-destructive">R$ {costs.taxBRL.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Custo Final:</span>
                        <p className="font-bold text-primary">R$ {costs.finalCostBRL.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Venda: </span>
                        <span className="font-medium">R$ {costs.sellingPrice.toFixed(2)}</span>
                      </div>
                      <Badge className={`${costs.netProfit >= 0 ? 'bg-green-500/20 text-green-600' : 'bg-destructive/20 text-destructive'}`}>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Lucro: R$ {costs.netProfit.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total Summary */}
        {totalResults.totalCost > 0 && (
          <div className="p-4 bg-accent/10 rounded-xl border border-accent/20 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Resumo Total
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Investimento</p>
                <p className="text-lg font-bold text-foreground">R$ {totalResults.totalCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Faturamento</p>
                <p className="text-lg font-bold text-foreground">R$ {totalResults.totalSelling.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lucro Total</p>
                <p className={`text-lg font-bold ${totalResults.totalProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  R$ {totalResults.totalProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">💡 Dica:</strong> Use a estratégia de consolidar várias peças no seu endereço dos EUA para baixar o frete unitário
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedPricingCalculator;
