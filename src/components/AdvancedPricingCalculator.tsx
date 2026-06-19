import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, TrendingUp, Plus, Trash2, Package, AlertCircle, ShieldCheck, AlertTriangle, FileText, FileSpreadsheet, CheckCircle, FileDown, Eye } from 'lucide-react';
import { Copy, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ShadingType } from 'docx';

type Currency = 'USD' | 'EUR' | 'GBP' | 'CNY';
type WeightCategory = 'light' | 'medium' | 'heavy';
type ExportType = 'pdf' | 'docx';

// Descrição alfandegária 100% dinâmica baseada no título do produto.
// Mapeia por palavras-chave em 3 categorias:
//  - Eletrônicos/tecnologia → termo técnico de comunicação
//  - Vestuário/calçado → termo têxtil casual
//  - Outros → descrição genérica de uso pessoal/utilidade doméstica com o nome
const ELECTRONICS_KW = ['celular','iphone','smartphone','fone','headphone','headset','earbud','airpod','smartwatch','watch','relogio','relógio','tablet','ipad','notebook','laptop','camera','câmera','console','playstation','xbox','nintendo','eletronico','eletrônico','tv','monitor','drone','carregador','cabo','mouse','teclado','speaker','caixa de som'];
const CLOTHING_KW = ['tenis','tênis','sapato','sneaker','bota','chinelo','sandalia','sandália','moletom','hoodie','camiseta','t-shirt','tshirt','camisa','polo','regata','jaqueta','casaco','blusa','bermuda','short','calca','calça','jeans','bone','boné','cap','meia','cueca','boxer','conjunto','vestido','saia','calcinha','sutia','sutiã'];

const getOptimizedDescription = (name: string): string => {
  const raw = (name || '').trim();
  if (!raw) return '';
  const n = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (ELECTRONICS_KW.some((k) => n.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
    return 'Dispositivo eletrônico de comunicação e acessórios';
  }
  if (CLOTHING_KW.some((k) => n.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
    return 'Vestuário casual de algodão e fibras sintéticas';
  }
  return `Item de uso pessoal/utilidade doméstica - ${raw}`;
};

interface SaveAsModalProps {
  exportType: ExportType;
  filename: string;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onFilenameChange: (value: string) => void;
}

const SaveAsModal: React.FC<SaveAsModalProps> = ({
  exportType,
  filename,
  isOpen,
  isSaving,
  onClose,
  onConfirm,
  onFilenameChange,
}) => (
  <Dialog open={isOpen} onOpenChange={(open) => !isSaving && !open && onClose()}>
    <DialogContent className="save-as-dialog z-[60] border-border bg-card p-0 text-card-foreground sm:max-w-md">
      <div className="rounded-xl border border-border/70 bg-card/95 p-6 shadow-strong backdrop-blur-sm">
        <DialogHeader className="space-y-2">
          <DialogTitle className="font-semibold text-foreground">
            Salvar {exportType === 'pdf' ? 'PDF' : 'Word (.docx)'} como...
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Digite o nome do arquivo e toque em OK para iniciar o download real no seu dispositivo.
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-[70] space-y-3 py-5">
          <Label htmlFor="export-filename" className="text-sm font-medium text-foreground">
            Nome do arquivo
          </Label>
          <Input
            id="export-filename"
            value={filename}
            onChange={(event) => onFilenameChange(event.target.value)}
            placeholder="Digite o nome do arquivo..."
            autoFocus
            className="save-as-input relative z-[70] h-11 rounded-xl border-border font-sans shadow-soft"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && filename.trim() && !isSaving) {
                void onConfirm();
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            O arquivo será salvo como <span className="font-medium text-foreground">{filename.trim() || 'seu-arquivo'}.{exportType}</span>
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="rounded-xl">
            Cancelar
          </Button>
          <Button onClick={() => void onConfirm()} disabled={!filename.trim() || isSaving} className="rounded-xl">
            {isSaving ? 'Gerando...' : 'OK'}
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
);

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
  GBP: number;
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
  GBP: { symbol: '£', flag: '🇬🇧', label: 'Libra' },
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
  const [filename, setFilename] = useState('');
  const [exportType, setExportType] = useState<ExportType>('pdf');
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1, EUR: 0.92, CNY: 7.25, BRL: 5.80, GBP: 0.79 });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [totalShipping, setTotalShipping] = useState<string>('');
  const [shippingCurrency, setShippingCurrency] = useState<Currency>('USD');
  const [items, setItems] = useState<ProductItem[]>([
    { id: '1', name: '', costPrice: '', declaredValue: '', profitMargin: '30', currency: 'USD', weightCategory: 'medium', estimatedGrams: 300, weightLabel: '~300g' }
  ]);
  const [camouflagedItems, setCamouflagedItems] = useState<Set<string>>(new Set());
  const [brandWarning, setBrandWarning] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Array<{
    id: string;
    savedAt: number;
    label: string;
    items: ProductItem[];
    totalShipping: string;
    shippingCurrency: Currency;
    totalCost: number;
    totalProfit: number;
  }>>(() => {
    try {
      const raw = localStorage.getItem('importafacil:calc-history');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const fetchRates = useCallback(async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setRates({
        USD: 1,
        EUR: data.rates.EUR,
        CNY: data.rates.CNY,
        BRL: data.rates.BRL,
        GBP: data.rates.GBP,
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
  const gbpToBrl = rates.BRL / rates.GBP;

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

  const getDefaultFileName = (type: ExportType) => {
    const date = new Date().toISOString().split('T')[0];
    return `Resumo_Importafacil_${date}`;
  };

  const buildExportFileName = (type: ExportType) => {
    const extension = type === 'pdf' ? 'pdf' : 'docx';
    const baseName = (filename.trim() || getDefaultFileName(type))
      .replace(/\.(pdf|docx)$/i, '')
      .trim();

    return `${baseName}.${extension}`;
  };

  const closeSaveDialog = () => {
    if (generatingPDF) return;
    setShowSaveDialog(false);
    setFilename('');
  };

  const openSaveDialog = (type: ExportType) => {
    if (generatingPDF) return;
    setExportType(type);
    setFilename(getDefaultFileName(type));
    setShowSaveDialog(true);
  };

  const triggerBlobDownload = (blob: Blob, nextFileName: string) => {
    console.log('triggerBlobDownload:', nextFileName, blob.size);
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', nextFileName);
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  };

  const createPdfBlob = async (): Promise<Blob> => {
    // Lazy-load jspdf + autotable to keep main bundle small
    const [{ default: JsPDF }, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const autoTable = (autoTableModule as { default: typeof import('jspdf-autotable').default }).default;

    const itemsToExport = adjustedItems.filter((item) => parseFloat(item.costPrice) > 0);
    const doc = new JsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();

    // Header banner
    doc.setFillColor(15, 59, 111);
    doc.rect(0, 0, pageWidth, 70, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Relatório de Importação - ImportaFácil', 40, 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      `Data: ${now.toLocaleDateString('pt-BR')}  |  USD R$ ${rates.BRL.toFixed(2)}  |  EUR R$ ${eurToBrl.toFixed(2)}  |  GBP R$ ${gbpToBrl.toFixed(2)}  |  CNY R$ ${cnyToBrl.toFixed(2)}`,
      40,
      52,
    );

    // Items table
    const body = itemsToExport.map((item, index) => {
      const costs = calculateItemCosts(item);
      const camouflaged = camouflagedItems.has(item.id) ? camouflageProductName(item.name) : { name: item.name };
      const displayName = (camouflaged.name || item.name || `Item ${index + 1}`).substring(0, 50);
      return [
        displayName,
        `${getCurrencySymbol(item.currency)} ${(parseFloat(item.costPrice) || 0).toFixed(2)}`,
        `$ ${(parseFloat(item.declaredValue) || 0).toFixed(2)}`,
        `${item.profitMargin || '0'}%`,
        `R$ ${costs.sellingPrice.toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: 90,
      head: [['Nome', 'Preço Custo', 'Declaração', 'Margem', 'Preço Venda']],
      body,
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, textColor: [30, 30, 30] },
      headStyles: { fillColor: [15, 59, 111], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
      margin: { left: 40, right: 40 },
    });

    // Totals
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
    let y = finalY + 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(`Investimento Total: R$ ${totalResults.totalCost.toFixed(2)}`, 40, y);
    y += 18;
    doc.text(`Faturamento Total: R$ ${totalResults.totalSelling.toFixed(2)}`, 40, y);
    y += 18;
    if (totalResults.totalProfit >= 0) doc.setTextColor(22, 130, 50);
    else doc.setTextColor(204, 30, 30);
    doc.text(`Lucro Total: R$ ${totalResults.totalProfit.toFixed(2)}`, 40, y);

    // Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Gerado por ImportaFácil', 40, doc.internal.pageSize.getHeight() - 24);

    return doc.output('blob') as Blob;
  };

  const createPdfDownload = async (pdfFileName: string): Promise<void> => {
    const blob = await createPdfBlob();
    triggerBlobDownload(blob, pdfFileName);
  };

  const createDocxBlob = async () => {
    const itemsToExport = adjustedItems.filter((item) => parseFloat(item.costPrice) > 0);
    const now = new Date();
    const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
    const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

    const headerCells = ['Nome do item', 'Custo (BRL)', 'Frete (BRL)', 'Preço de venda (BRL)'].map((label, index) =>
      new TableCell({
        borders: cellBorders,
        width: { size: index === 0 ? 3600 : 1800, type: WidthType.DXA },
        shading: { fill: '0F3B6F', type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: label, bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })],
          }),
        ],
      }),
    );

    const dataRows = itemsToExport.map((item, index) => {
      const costs = calculateItemCosts(item);
      const camouflaged = camouflagedItems.has(item.id) ? camouflageProductName(item.name) : { name: item.name };
      const displayName = (camouflaged.name || item.name || `Item ${index + 1}`).substring(0, 40);
      const values = [displayName, `R$ ${costs.costPriceBRL.toFixed(2)}`, `R$ ${costs.itemShippingBRL.toFixed(2)}`, `R$ ${costs.sellingPrice.toFixed(2)}`];

      return new TableRow({
        children: values.map((value, cellIndex) =>
          new TableCell({
            borders: cellBorders,
            width: { size: cellIndex === 0 ? 3600 : 1800, type: WidthType.DXA },
            shading: index % 2 === 0 ? { fill: 'F5F5F5', type: ShadingType.CLEAR } : undefined,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: cellIndex >= 1 ? AlignmentType.RIGHT : AlignmentType.LEFT,
                children: [new TextRun({ text: value, size: 18, font: 'Arial', color: '1E1E1E' })],
              }),
            ],
          }),
        ),
      });
    });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
              children: [new TextRun({ text: 'Relatório de Importação - ImportaFácil', bold: true, size: 32, font: 'Arial', color: '0F3B6F' })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
              children: [
                new TextRun({
                  text: `Data: ${now.toLocaleDateString('pt-BR')}  |  1 USD = R$ ${rates.BRL.toFixed(2)}  |  1 EUR = R$ ${eurToBrl.toFixed(2)}  |  1 GBP = R$ ${gbpToBrl.toFixed(2)}  |  1 CNY = R$ ${cnyToBrl.toFixed(2)}`,
                  size: 18,
                  font: 'Arial',
                  color: '666666',
                }),
              ],
            }),
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              columnWidths: [3600, 1800, 1800, 1800],
              rows: [new TableRow({ children: headerCells }), ...dataRows],
            }),
            new Paragraph({
              spacing: { before: 300 },
              children: [new TextRun({ text: `Investimento Total: R$ ${totalResults.totalCost.toFixed(2)}`, bold: true, size: 22, font: 'Arial' })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `Faturamento Total: R$ ${totalResults.totalSelling.toFixed(2)}`, bold: true, size: 22, font: 'Arial' })],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Lucro Total: R$ ${totalResults.totalProfit.toFixed(2)}`,
                  bold: true,
                  size: 24,
                  font: 'Arial',
                  color: totalResults.totalProfit >= 0 ? '168232' : 'CC1E1E',
                }),
              ],
            }),
            new Paragraph({
              spacing: { before: 400 },
              children: [
                new TextRun({
                  text: 'Gerado por ImportaFácil - Seu guia mais completo sobre importações',
                  size: 16,
                  font: 'Arial',
                  color: '999999',
                  italics: true,
                }),
              ],
            }),
          ],
        },
      ],
    });

    return Packer.toBlob(doc);
  };

  const handleSave = async () => {
    if (!filename.trim()) return;

    const nextFileName = buildExportFileName(exportType);
    console.log('handleSave:', { exportType, nextFileName });

    setGeneratingPDF(true);
    const loadingToast = toast.loading(`Gerando ${exportType === 'pdf' ? 'PDF' : 'Word'}...`, {
      description: 'Preparando o arquivo para envio ao navegador.',
    });

    try {
      if (exportType === 'pdf') {
        await createPdfDownload(nextFileName);
      } else {
        const blob = await createDocxBlob();
        triggerBlobDownload(blob, nextFileName);
      }

      toast.success('Download enviado', {
        id: loadingToast,
        description: `Arquivo "${nextFileName}" enviado para o navegador.`,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });

      setShowSaveDialog(false);
      setFilename('');
    } catch (error) {
      console.log('Erro ao salvar arquivo:', error);
      console.error('Erro crítico no download:', error);
      toast.error('Erro ao gerar o arquivo', {
        id: loadingToast,
        description: 'Confira o console e tente novamente.',
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (generatingPDF || activeItems.length === 0) return;

    setGeneratingPDF(true);
    const loadingToast = toast.loading('Gerando pré-visualização do PDF...', {
      description: 'Abrindo em uma nova aba para visualização.',
    });

    // Pré-abre a aba de forma síncrona (necessário para evitar bloqueio de pop-up no Safari/Chrome mobile)
    const previewWindow = window.open('', '_blank');

    try {
      const blob = await createPdfBlob();
      const blobUrl = URL.createObjectURL(blob);

      if (previewWindow && !previewWindow.closed) {
        // Funciona em desktop e na maioria dos navegadores mobile
        previewWindow.location.href = blobUrl;
      } else {
        // Fallback: pop-up bloqueado — usa link temporário com target=_blank
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Libera o URL após tempo suficiente para o navegador carregar o PDF
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);

      toast.success('Pré-visualização aberta', {
        id: loadingToast,
        description: 'Use o menu do navegador para salvar ou compartilhar.',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error('Erro ao gerar pré-visualização do PDF:', error);
      previewWindow?.close();
      toast.error('Erro ao gerar pré-visualização', {
        id: loadingToast,
        description: 'Tente novamente em instantes.',
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ============================================================
  // Análise de Risco do Lobo + Cópia de resumo + Histórico
  // ============================================================
  const riskAnalysis = useMemo(() => {
    const totalDeclUSD = totalDeclaration;
    const totalKg = totalWeight / 1000;
    if (activeItems.length === 0) return null;
    const isLow = totalDeclUSD < 50 && totalKg < 2;
    if (isLow) {
      return {
        level: 'low' as const,
        title: 'Risco Baixo — Caminho Livre 🐺',
        message: 'Sua declaração está abaixo de $50 e o pacote leve. A chance de retenção na alfândega é pequena.',
        tip: 'Dica de ouro: consolide várias peças em UMA caixa só na sua redirecionadora pra diluir o frete por item e manter o peso controlado.',
      };
    }
    return {
      level: 'high' as const,
      title: 'Alerta do Lobo — Atenção na Fiscalização ⚠️',
      message: 'Pacotes com mais de $50 declarados ou acima de 2kg chamam mais atenção na fiscalização.',
      tip: 'Use redirecionadoras pra FRACIONAR o envio em 2 ou 3 caixas menores — reduz drasticamente o risco de bloqueio.',
    };
  }, [totalDeclaration, totalWeight, activeItems.length]);

  // Auto-save últimas 5 simulações no LocalStorage (debounce 1.5s)
  useEffect(() => {
    if (totalResults.totalCost <= 0) return;
    const t = setTimeout(() => {
      const firstName = items.find((i) => i.name.trim())?.name?.trim() || 'Simulação';
      const snap = {
        id: Date.now().toString(),
        savedAt: Date.now(),
        label: firstName.substring(0, 40),
        items,
        totalShipping,
        shippingCurrency,
        totalCost: totalResults.totalCost,
        totalProfit: totalResults.totalProfit,
      };
      setHistory((prev) => {
        // Evita duplicado consecutivo idêntico
        if (prev[0] && JSON.stringify(prev[0].items) === JSON.stringify(items) && prev[0].totalShipping === totalShipping) {
          return prev;
        }
        const next = [snap, ...prev].slice(0, 5);
        try { localStorage.setItem('importafacil:calc-history', JSON.stringify(next)); } catch {}
        return next;
      });
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, totalShipping, shippingCurrency, totalResults.totalCost]);

  const restoreSimulation = (snapId: string) => {
    const snap = history.find((h) => h.id === snapId);
    if (!snap) return;
    setItems(snap.items);
    setTotalShipping(snap.totalShipping);
    setShippingCurrency(snap.shippingCurrency);
    toast.success('Simulação restaurada!', { description: snap.label });
  };

  const handleCopyResumo = async () => {
    const firstItem = items.find((i) => parseFloat(i.costPrice) > 0);
    const productName = firstItem?.name?.trim() || 'Itens importados';
    const text =
      `*ImportaFácil - Resumo do Cálculo* 🐺\n\n` +
      `📦 *Produto:* ${productName}\n` +
      `💰 *Investimento:* R$ ${totalResults.totalCost.toFixed(2)}\n` +
      `💵 *Faturamento:* R$ ${totalResults.totalSelling.toFixed(2)}\n` +
      `📈 *Lucro Real:* R$ ${totalResults.totalProfit.toFixed(2)}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Resumo copiado!');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast.success('Resumo copiado!'); } catch { toast.error('Não foi possível copiar'); }
      document.body.removeChild(ta);
    }
  };

  return (

    <Card data-tour="calc-root" className="w-full max-w-2xl" translate="no">
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
        <div ref={summaryRef} data-export-root="pricing-export">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs font-mono">
            🇺🇸 1 USD = R$ {usdToBrl.toFixed(2)}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono">
            🇪🇺 1 EUR = R$ {eurToBrl.toFixed(2)}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono">
            🇬🇧 1 GBP = R$ {gbpToBrl.toFixed(2)}
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
        <div data-tour="calc-inputs" className="p-3 bg-muted/50 rounded-xl space-y-2">
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

                {/* Descrição Otimizada (Auto-Camuflagem para Alfândega) */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>Descrição Otimizada (Alfândega)</span>
                    <Badge
                      variant="outline"
                      className="h-4 px-1.5 text-[10px] font-semibold bg-blue-500/10 text-blue-600 border-blue-500/30"
                    >
                      Auto
                    </Badge>
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    placeholder="Ex: Vestuário de uso diário"
                    value={getOptimizedDescription(item.name)}
                    className="h-8 text-sm bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-300 cursor-default"
                  />
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
          <div data-tour="calc-results" className="p-4 bg-accent/10 rounded-xl border border-accent/20 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Resumo Total
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center items-stretch">
              <div className="flex flex-col justify-center">
                <p className="text-xs text-muted-foreground">Investimento</p>
                <p className="text-lg font-bold text-foreground">R$ {totalResults.totalCost.toFixed(2)}</p>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-xs text-muted-foreground">Faturamento</p>
                <p className="text-lg font-bold text-foreground">R$ {totalResults.totalSelling.toFixed(2)}</p>
              </div>
              <div
                className={`rounded-xl px-2 py-2 shadow-md ring-2 ${
                  totalResults.totalProfit >= 0
                    ? 'bg-gradient-to-br from-emerald-400/25 to-emerald-500/15 ring-emerald-400/60'
                    : 'bg-destructive/15 ring-destructive/50'
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1">
                  💰 Lucro Real
                </p>
                <p
                  className={`text-2xl md:text-3xl font-extrabold leading-tight drop-shadow-sm ${
                    totalResults.totalProfit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive'
                  }`}
                >
                  R$ {totalResults.totalProfit.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                variant="default"
                className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-medium"
                onClick={handlePreviewPdf}
                disabled={generatingPDF || activeItems.length === 0}
              >
                <Eye className="h-4 w-4" />
                Visualizar e Gerar PDF
              </Button>
              <Button
                variant="default"
                className="flex-1 gap-2"
                onClick={() => openSaveDialog('pdf')}
                disabled={generatingPDF || activeItems.length === 0}
              >
                <FileDown className="h-4 w-4" />
                Baixar PDF
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 border-accent/30 text-accent hover:bg-accent/10"
                onClick={() => openSaveDialog('docx')}
                disabled={generatingPDF || activeItems.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Word
              </Button>
            </div>
          </div>
        )}
        </div>{/* end summaryRef */}

        <SaveAsModal
          exportType={exportType}
          filename={filename}
          isOpen={showSaveDialog}
          isSaving={generatingPDF}
          onClose={closeSaveDialog}
          onConfirm={handleSave}
          onFilenameChange={setFilename}
        />

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
