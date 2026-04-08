import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, TrendingUp, Plus, Trash2, Package, AlertCircle, ShieldCheck, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type Currency = 'USD' | 'EUR' | 'CNY';
type WeightCategory = 'light' | 'medium' | 'heavy';

// Peso estimado em gramas por palavra-chave do nome
const WEIGHT_MAP: { keywords: string[]; grams: number; label: string }[] = [
  { keywords: ['boné', 'bone', 'touca', 'acessório', 'acessorio', 'meia', 'cueca', 'calcinha', 'cap'], grams: 150, label: '~150g' },
  { keywords: ['camiseta', 't-shirt', 'tshirt', 'camisa', 'polo', 'regata'], grams: 200, label: '~200g' },
  { keywords: ['bermuda', 'short', 'calção', 'calcao', 'shorts'], grams: 350, label: '~350g' },
  { keywords: ['calça', 'calca', 'moletom', 'jaqueta', 'hoodie', 'casaco', 'jacket'], grams: 700, label: '~700g' },
  { keywords: ['tênis', 'tenis', 'sapato', 'sneaker', 'bota'], grams: 1000, label: '~1kg' },
];

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
  weightCategory: WeightCategory;
  estimatedGrams: number;
  weightLabel: string;
}

const CURRENCY_CONFIG = {
  USD: { symbol: '$', flag: '🇺🇸', label: 'Dólar' },
  EUR: { symbol: '€', flag: '🇪🇺', label: 'Euro' },
  CNY: { symbol: '¥', flag: '🇨🇳', label: 'Yuan' },
};

// Marcas famosas que devem ser substituídas
const FAMOUS_BRANDS = [
  'lacoste', 'nike', 'adidas', 'gucci', 'prada', 'louis vuitton', 'lv', 'chanel',
  'dior', 'balenciaga', 'yeezy', 'jordan', 'supreme', 'off-white', 'bape',
  'burberry', 'versace', 'fendi', 'hermès', 'hermes', 'rolex', 'cartier',
  'boss', 'hugo boss', 'ralph lauren', 'polo', 'tommy hilfiger', 'calvin klein',
  'armani', 'dolce', 'gabbana', 'givenchy', 'valentino', 'moncler', 'stone island',
  'the north face', 'tnf', 'new balance', 'puma', 'asics', 'converse', 'vans',
  'oakley', 'ray-ban', 'rayban', 'apple', 'samsung', 'louis vitton'
];

// Substituições genéricas por categoria detectada
const GENERIC_REPLACEMENTS: Record<string, string[]> = {
  'boné': ['Fashion Hat', 'Cotton Cap', 'Sport Cap'],
  'cap': ['Fashion Hat', 'Cotton Cap', 'Sport Cap'],
  'bone': ['Fashion Hat', 'Cotton Cap', 'Sport Cap'],
  'chapeu': ['Fashion Hat', 'Cotton Cap'],
  'camiseta': ['Men Clothing', 'Cotton T-shirt', 'Casual Shirt'],
  'camisa': ['Men Clothing', 'Cotton Shirt'],
  'polo': ['Men Clothing', 'Cotton Polo'],
  'tenis': ['Casual Shoes', 'Sport Shoes', 'Running Shoes'],
  'tênis': ['Casual Shoes', 'Sport Shoes', 'Running Shoes'],
  'sneaker': ['Casual Shoes', 'Sport Shoes'],
  'sapato': ['Casual Shoes', 'Leather Shoes'],
  'jaqueta': ['Windbreaker', 'Polyester Jacket', 'Light Jacket'],
  'moletom': ['Cotton Hoodie', 'Sport Hoodie'],
  'hoodie': ['Cotton Hoodie', 'Sport Hoodie'],
  'casaco': ['Polyester Jacket', 'Winter Coat'],
  'bolsa': ['Fashion Bag', 'Leather Bag'],
  'bag': ['Fashion Bag', 'Travel Bag'],
  'mochila': ['Travel Bag', 'Sport Bag'],
  'relogio': ['Fashion Watch', 'Quartz Watch'],
  'relógio': ['Fashion Watch', 'Quartz Watch'],
  'watch': ['Fashion Watch', 'Quartz Watch'],
  'oculos': ['Fashion Sunglasses', 'Sport Glasses'],
  'óculos': ['Fashion Sunglasses', 'Sport Glasses'],
  'calça': ['Cotton Pants', 'Casual Pants'],
  'calca': ['Cotton Pants', 'Casual Pants'],
  'short': ['Sport Shorts', 'Casual Shorts'],
  'bermuda': ['Sport Shorts', 'Casual Shorts'],
};

// Faixas de declaração por peso
const WEIGHT_DECLARATION_RANGES: Record<WeightCategory, { min: number; max: number; label: string }> = {
  light: { min: 2.10, max: 3.15, label: 'Até 300g (Boné/Camiseta)' },
  medium: { min: 5.20, max: 7.85, label: '301g a 1.1kg (Tênis/Moletom)' },
  heavy: { min: 8.10, max: 9.80, label: 'Acima de 1.1kg (Jaqueta/Pesados)' }
};

// Gerar valor quebrado aleatório dentro de uma faixa
const generateBrokenValue = (min: number, max: number): string => {
  const base = Math.random() * (max - min) + min;
  // Garantir valor "quebrado" com centavos não redondos
  const cents = [0.13, 0.27, 0.43, 0.57, 0.63, 0.78, 0.83, 0.91, 0.17, 0.23];
  const randomCents = cents[Math.floor(Math.random() * cents.length)];
  const finalValue = Math.floor(base) + randomCents;
  return Math.min(finalValue, max).toFixed(2);
};

// Verificar se contém marca famosa
const containsBrand = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return FAMOUS_BRANDS.some(brand => lowerText.includes(brand));
};

// Substituir marca por termo genérico
const camouflageProductName = (name: string): { name: string; wasCamouflaged: boolean } => {
  if (!name.trim()) return { name, wasCamouflaged: false };
  
  let camouflaged = name.toLowerCase();
  let wasCamouflaged = false;
  
  // Remover marcas
  for (const brand of FAMOUS_BRANDS) {
    if (camouflaged.includes(brand)) {
      camouflaged = camouflaged.replace(new RegExp(brand, 'gi'), '').trim();
      wasCamouflaged = true;
    }
  }
  
  // Encontrar termo genérico baseado no tipo de produto
  for (const [keyword, replacements] of Object.entries(GENERIC_REPLACEMENTS)) {
    if (camouflaged.includes(keyword) || name.toLowerCase().includes(keyword)) {
      const randomReplacement = replacements[Math.floor(Math.random() * replacements.length)];
      return { name: randomReplacement, wasCamouflaged: true };
    }
  }
  
  // Se removeu marca mas não achou categoria, usar termo genérico padrão
  if (wasCamouflaged) {
    return { name: 'Fashion Item', wasCamouflaged: true };
  }
  
  return { name, wasCamouflaged: false };
};

// Estimar peso em gramas pelo nome do item
const estimateWeight = (name: string): { grams: number; label: string; category: WeightCategory } => {
  const lowerName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const entry of WEIGHT_MAP) {
    for (const kw of entry.keywords) {
      const normalizedKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lowerName.includes(normalizedKw)) {
        const cat: WeightCategory = entry.grams <= 200 ? 'light' : entry.grams >= 700 ? 'heavy' : 'medium';
        return { grams: entry.grams, label: entry.label, category: cat };
      }
    }
  }
  return { grams: 300, label: '~300g', category: 'medium' };
};

const detectWeightCategory = (name: string): WeightCategory => estimateWeight(name).category;

const AdvancedPricingCalculator: React.FC = () => {
  const summaryRef = useRef<HTMLDivElement>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1, EUR: 0.92, CNY: 7.25, BRL: 5.80 });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [totalShipping, setTotalShipping] = useState<string>('');
  const [shippingCurrency, setShippingCurrency] = useState<Currency>('USD');
  const [items, setItems] = useState<ProductItem[]>([
    { id: '1', name: '', costPrice: '', declaredValue: '', profitMargin: '30', currency: 'USD', weightCategory: 'medium', estimatedGrams: 300, weightLabel: '~300g' }
  ]);
  const [camouflagedItems, setCamouflagedItems] = useState<Set<string>>(new Set());
  const [brandWarning, setBrandWarning] = useState<string | null>(null);

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
    const inUSD = value / rates[fromCurrency];
    return inUSD * rates.BRL;
  };

  // Calcular total de declarações e aplicar teto de $9.90
  const { adjustedItems, totalDeclaration, wasAdjusted } = useMemo(() => {
    const activeItems = items.filter(item => parseFloat(item.costPrice) > 0);
    const totalDeclared = activeItems.reduce((sum, item) => sum + (parseFloat(item.declaredValue) || 0), 0);
    
    if (totalDeclared <= 9.90) {
      return { adjustedItems: items, totalDeclaration: totalDeclared, wasAdjusted: false };
    }
    
    // Recalcular para ficar entre $9.00 e $9.80
    const targetTotal = 9.00 + Math.random() * 0.80; // Entre 9.00 e 9.80
    const ratio = targetTotal / totalDeclared;
    
    const adjusted = items.map(item => {
      if (parseFloat(item.costPrice) <= 0) return item;
      const originalDecl = parseFloat(item.declaredValue) || 0;
      const newDecl = originalDecl * ratio;
      // Manter valor "quebrado"
      const cents = [0.13, 0.23, 0.37, 0.43, 0.57, 0.67, 0.73, 0.87];
      const finalDecl = Math.floor(newDecl) + cents[Math.floor(Math.random() * cents.length)];
      return { ...item, declaredValue: Math.max(0.50, finalDecl).toFixed(2) };
    });
    
    const newTotal = adjusted
      .filter(item => parseFloat(item.costPrice) > 0)
      .reduce((sum, item) => sum + (parseFloat(item.declaredValue) || 0), 0);
    
    return { adjustedItems: adjusted, totalDeclaration: newTotal, wasAdjusted: true };
  }, [items]);

  const addItem = () => {
    if (items.length >= 10) return;
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      costPrice: '',
      declaredValue: '',
      profitMargin: '30',
      currency: 'USD',
      weightCategory: 'medium',
      estimatedGrams: 300,
      weightLabel: '~300g'
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
    setCamouflagedItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateItem = (id: string, field: keyof ProductItem, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      let updatedItem = { ...item, [field]: value };
      
      // Se mudou o nome, verificar marca, estimar peso e aplicar camuflagem
      if (field === 'name') {
        const w = estimateWeight(value);
        updatedItem.estimatedGrams = w.grams;
        updatedItem.weightLabel = w.label;
        updatedItem.weightCategory = w.category;

        if (containsBrand(value)) {
          setBrandWarning('Cuidado! O Lobo recomenda não usar nomes de marcas para evitar a fiscalização de pirataria.');
          setCamouflagedItems(prev => new Set(prev).add(id));
          const range = WEIGHT_DECLARATION_RANGES[w.category];
          updatedItem.declaredValue = generateBrokenValue(range.min, range.max);
        } else {
          setBrandWarning(null);
          if (w.category !== item.weightCategory) {
            const range = WEIGHT_DECLARATION_RANGES[w.category];
            updatedItem.declaredValue = generateBrokenValue(range.min, range.max);
          }
        }
      }
      
      // Se mudou categoria de peso, atualizar declaração
      if (field === 'weightCategory') {
        const range = WEIGHT_DECLARATION_RANGES[value as WeightCategory];
        updatedItem.declaredValue = generateBrokenValue(range.min, range.max);
      }
      
      return updatedItem;
    }));
  };

  // Auto-preencher declaração quando adiciona preço de custo
  const handleCostPriceChange = (id: string, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      let updatedItem = { ...item, costPrice: value };
      
      // Se adicionou preço e declaração está vazia, auto-preencher
      if (parseFloat(value) > 0 && !item.declaredValue) {
        const range = WEIGHT_DECLARATION_RANGES[item.weightCategory];
        updatedItem.declaredValue = generateBrokenValue(range.min, range.max);
      }
      
      return updatedItem;
    }));
  };

  // Calcular frete rateado proporcional ao peso (já convertido para BRL)
  const activeItems = adjustedItems.filter(item => parseFloat(item.costPrice) > 0);
  const totalShippingValue = parseFloat(totalShipping) || 0;
  const totalShippingBRL = convertToBRL(totalShippingValue, shippingCurrency);
  const totalWeight = activeItems.reduce((sum, item) => sum + (item.estimatedGrams || 300), 0);
  
  const getShippingForItem = (item: ProductItem): number => {
    if (totalWeight === 0 || totalShippingBRL === 0) return 0;
    return (item.estimatedGrams || 300) / totalWeight * totalShippingBRL;
  };

  // Calcular cotações para display
  const usdToBrl = rates.BRL;
  const eurToBrl = rates.BRL / rates.EUR;
  const cnyToBrl = rates.BRL / rates.CNY;

  // Cálculos para cada item
  const calculateItemCosts = (item: ProductItem) => {
    const costPrice = parseFloat(item.costPrice) || 0;
    const declaredValue = parseFloat(item.declaredValue) || 0;
    const profitMargin = parseFloat(item.profitMargin) || 0;

    const costPriceBRL = convertToBRL(costPrice, item.currency);
    const itemShippingBRL = getShippingForItem(item);
    const costWithShippingBRL = costPriceBRL + itemShippingBRL;
    const declaredValueBRL = convertToBRL(declaredValue, 'USD'); // Declaração sempre em USD
    const taxBRL = declaredValueBRL * 0.60;
    const finalCostBRL = costWithShippingBRL + taxBRL;
    const sellingPrice = finalCostBRL * (1 + profitMargin / 100);
    const netProfit = sellingPrice - finalCostBRL;

    return {
      costPriceBRL,
      costWithShippingBRL,
      itemShippingBRL,
      declaredValueBRL,
      taxBRL,
      finalCostBRL,
      sellingPrice,
      netProfit
    };
  };

  // Total geral
  const totalResults = adjustedItems.reduce((acc, item) => {
    const costs = calculateItemCosts(item);
    return {
      totalCost: acc.totalCost + costs.finalCostBRL,
      totalSelling: acc.totalSelling + costs.sellingPrice,
      totalProfit: acc.totalProfit + costs.netProfit
    };
  }, { totalCost: 0, totalSelling: 0, totalProfit: 0 });

  const getCurrencySymbol = (currency: Currency) => CURRENCY_CONFIG[currency].symbol;


  const generatePDF = async () => {
    const element = summaryRef.current;
    if (!element) {
      console.error('PDF: summaryRef element not found');
      return;
    }

    setGeneratingPDF(true);
    console.log('PDF: Iniciando geração...');

    try {
      // Temporarily expand for capture (avoid mobile clipping)
      const originalWidth = element.style.width;
      const originalMaxWidth = element.style.maxWidth;
      const originalOverflow = element.style.overflow;
      element.style.width = '800px';
      element.style.maxWidth = '800px';
      element.style.overflow = 'visible';

      // Small delay to let the browser reflow
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('PDF: Capturando HTML com html2canvas...');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        scrollY: -window.scrollY,
      });

      // Restore original styles
      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;
      element.style.overflow = originalOverflow;

      console.log('PDF: Canvas gerado, criando PDF...');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      const padding = 12;

      const imgData = canvas.toDataURL('image/png');
      const aspectRatio = canvas.width / canvas.height;
      let imgWidth = pdfWidth - 2 * padding;
      let imgHeight = imgWidth / aspectRatio;

      if (imgHeight > pdfHeight - 2 * padding - 24) {
        imgHeight = pdfHeight - 2 * padding - 24;
        imgWidth = imgHeight * aspectRatio;
      }

      // Header
      pdf.setFontSize(18);
      pdf.setTextColor(15, 59, 111);
      pdf.text('ImportaFácil - Relatório de Operação', padding, padding + 6);
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      const now = new Date();
      pdf.text(`Data: ${now.toLocaleDateString('pt-BR')} | Câmbio: 1 USD = R$ ${rates.BRL.toFixed(2)}`, padding, padding + 14);

      // Separator line
      pdf.setDrawColor(255, 122, 0);
      pdf.setLineWidth(0.8);
      pdf.line(padding, padding + 18, pdfWidth - padding, padding + 18);

      // Add captured image
      const imgY = padding + 22;
      pdf.addImage(imgData, 'PNG', padding, imgY, imgWidth, imgHeight);

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Gerado por ImportaFácil — Seu guia mais completo sobre importações', padding, pdfHeight - 8);

      // Mobile-friendly download using blob + temp link
      const dateStr = now.toISOString().split('T')[0];
      const filename = `Resumo_Importafacil_${dateStr}.pdf`;
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      console.log('PDF: Gerado com sucesso!', filename);
    } catch (error) {
      console.error('PDF: Erro ao gerar:', error);
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl" translate="no">
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
        <div ref={summaryRef}>
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

        {/* Camouflage Status */}
        {(camouflagedItems.size > 0 || wasAdjusted) && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              🐺 O Lobo camuflou sua declaração: Termos genéricos e valores abaixo de $10 aplicados
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total declarado: ${totalDeclaration.toFixed(2)} {wasAdjusted && '(ajustado automaticamente)'}
            </p>
          </div>
        )}

        {/* Brand Warning */}
        {brandWarning && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-fade-in">
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {brandWarning}
            </p>
          </div>
        )}

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
          {activeItems.length > 1 && totalShippingBRL > 0 && (
            <Badge variant="secondary" className="text-xs">
              Frete proporcional ao peso ({activeItems.length} itens, {(totalWeight / 1000).toFixed(1)}kg total)
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

          {adjustedItems.map((item, index) => {
            const costs = calculateItemCosts(item);
            const hasData = parseFloat(item.costPrice) > 0;
            const currencySymbol = getCurrencySymbol(item.currency);
            const isCamouflaged = camouflagedItems.has(item.id);

            return (
              <div key={item.id} className={`p-3 border rounded-xl bg-card space-y-3 ${isCamouflaged ? 'border-green-500/50' : 'border-border'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant={isCamouflaged ? "default" : "outline"} className={`h-6 w-6 flex items-center justify-center p-0 text-xs flex-shrink-0 ${isCamouflaged ? 'bg-green-500' : ''}`}>
                      {isCamouflaged ? '🐺' : index + 1}
                    </Badge>
                    <Input
                      type="text"
                      placeholder="Nome do item ou anotação..."
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      className="h-8 text-sm flex-1"
                      translate="no"
                      lang="pt-BR"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-notranslate="true"
                      style={{ textTransform: 'none' }}
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

                {/* Weight display + Category Selector */}
                <div className="flex gap-2 items-center">
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    ⚖️ {item.weightLabel || '~300g'}
                  </Badge>
                  <Select 
                    value={item.weightCategory} 
                    onValueChange={(v) => updateItem(item.id, 'weightCategory', v)}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WEIGHT_DECLARATION_RANGES).map(([key, config]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      onChange={(e) => handleCostPriceChange(item.id, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Declaração ($)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Auto"
                      value={item.declaredValue}
                      onChange={(e) => updateItem(item.id, 'declaredValue', e.target.value)}
                      className="h-8 text-sm bg-green-500/5"
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

            {/* PDF Button */}
            <Button
              variant="outline"
              className="w-full mt-2 gap-2 border-accent/30 text-accent hover:bg-accent/10"
              onClick={() => generatePDF()}
              disabled={generatingPDF}
            >
              {generatingPDF ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Gerar Resumo em PDF
                </>
              )}
            </Button>
          </div>
        )}
        </div>{/* end summaryRef */}

        {/* Tip */}
        <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">💡 Dica:</strong> Use a estratégia de consolidar várias peças na sua redirecionadora para baixar o frete unitário
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedPricingCalculator;
