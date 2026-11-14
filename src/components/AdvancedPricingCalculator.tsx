import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, TrendingUp, Plus, Trash2, Package, AlertCircle, FileText, FileSpreadsheet, CheckCircle, FileDown, Eye } from 'lucide-react';
import { Copy, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ShadingType } from 'docx';
import ProductDescriptionAssistant from '@/components/calculator/ProductDescriptionAssistant';

type Currency = 'USD' | 'EUR' | 'GBP' | 'CNY' | 'PLN' | 'JPY' | 'SAR' | 'AED';
type DeclarationCurrency = 'USD' | 'EUR';
type WeightCategory = 'light' | 'medium' | 'heavy';
type ExportType = 'pdf' | 'docx';

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
  PLN: number;
  JPY: number;
  SAR: number;
  AED: number;
}

interface ProductItem {
  id: string;
  name: string;
  costPrice: string;
  declaredValue: string;
  declaredCurrency: DeclarationCurrency;
  profitMargin: string;
  currency: Currency;
  weightCategory: WeightCategory;
  estimatedGrams: number;
  weightLabel: string;
  declarationDescription?: string;
}

const CURRENCY_CONFIG = {
  USD: { symbol: '$', flag: '🇺🇸', label: 'Dólar' },
  EUR: { symbol: '€', flag: '🇪🇺', label: 'Euro' },
  GBP: { symbol: '£', flag: '🇬🇧', label: 'Libra' },
  CNY: { symbol: '¥', flag: '🇨🇳', label: 'Yuan' },
  PLN: { symbol: 'zł', flag: '🇵🇱', label: 'Zloty' },
  JPY: { symbol: '¥', flag: '🇯🇵', label: 'Iene' },
  SAR: { symbol: '﷼', flag: '🇸🇦', label: 'Rial' },
  AED: { symbol: 'د.إ', flag: '🇦🇪', label: 'Dirham' },
};

// País/redirecionador → moeda usada automaticamente
const ORIGIN_CURRENCY: { label: string; currency: Currency }[] = [
  { label: '🇺🇸 EUA', currency: 'USD' },
  { label: '🇨🇳 China', currency: 'CNY' },
  { label: '🇬🇧 Reino Unido', currency: 'GBP' },
  { label: '🇪🇸 Espanha', currency: 'EUR' },
  { label: '🇩🇪 Alemanha', currency: 'EUR' },
  { label: '🇵🇱 Polônia', currency: 'PLN' },
  { label: '🇯🇵 Japão', currency: 'JPY' },
  { label: '🇸🇦 Arábia Saudita', currency: 'SAR' },
  { label: '🇦🇪 Dubai', currency: 'AED' },
];

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

const isValidDeclaredValue = (value: string): boolean => {
  if (!value.trim()) return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const declarationFromTitle = (title: string, weightCategory: WeightCategory = 'medium'): { value: number; min: number; max: number; category: string } | null => {
  const name = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (!name.trim()) return null;
  if (/corta[- ]?vento|windbreaker/.test(name)) return { value: 4, min: 4, max: 4, category: 'Corta-vento' };
  if (/blusa de frio|moletom|hoodie|anorak|jaqueta|casaco|parka|velejad|puffer/.test(name)) {
    const heavy = weightCategory === 'heavy' || /velejad|puffer|casaco|parka|jaqueta pesada/.test(name);
    return heavy ? { value: 7, min: 6, max: 8, category: 'Blusa de frio pesada' } : { value: 5, min: 4, max: 6, category: 'Blusa de frio leve' };
  }
  if (/camiseta|t-shirt|tee\b|regata/.test(name)) return { value: 3.5, min: 3, max: 4, category: 'Camiseta' };
  if (/bone|chapeu|cap\b|bucket/.test(name)) return { value: 2.5, min: 2, max: 3, category: 'Boné ou chapéu' };
  return null;
};

const AdvancedPricingCalculator: React.FC = () => {
  const summaryRef = useRef<HTMLDivElement>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filename, setFilename] = useState('');
  const [exportType, setExportType] = useState<ExportType>('pdf');
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1, EUR: 0.92, CNY: 7.25, BRL: 5.80, GBP: 0.79, PLN: 3.95, JPY: 150, SAR: 3.75, AED: 3.67 });
  const [rateError, setRateError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [totalShipping, setTotalShipping] = useState<string>('');
  const [shippingCurrency, setShippingCurrency] = useState<Currency>('USD');
  const [items, setItems] = useState<ProductItem[]>([
    { id: '1', name: '', costPrice: '', declaredValue: '', declaredCurrency: 'EUR', profitMargin: '30', currency: 'USD', weightCategory: 'medium', estimatedGrams: 300, weightLabel: '~300g' }
  ]);
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
    schemaVersion?: number;
  }>>(() => {
    try {
      const raw = localStorage.getItem('importafacil:calc-history');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  const fetchRates = useCallback(async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      if (!data?.rates?.BRL || !data.rates.PLN || !data.rates.EUR) throw new Error('rates');
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

  // Convert from any currency to BRL
  const convertToBRL = (value: number, fromCurrency: Currency): number => {
    const inUSD = value / rates[fromCurrency];
    return inUSD * rates.BRL;
  };

  // Valores de declaração nunca são estimados nem reescritos; usar somente o informado.
  const adjustedItems = items;
  const totalDeclaration = useMemo(() => items
    .filter(item => parseFloat(item.costPrice) > 0)
    .reduce((sum, item) => sum + (isValidDeclaredValue(item.declaredValue) ? Number(item.declaredValue) : 0), 0), [items]);

  const addItem = () => {
    if (items.length >= 10) return;
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      costPrice: '',
      declaredValue: '',
      declaredCurrency: 'EUR',
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
  };

  const updateItem = (id: string, field: keyof ProductItem, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updatedItem = { ...item, [field]: value };

      // O nome atualiza o peso e preenche uma sugestão de declaração apenas
      // enquanto o usuário ainda não informou um valor manual.
      if (field === 'name') {
        const w = estimateWeight(value);
        updatedItem.estimatedGrams = w.grams;
        updatedItem.weightLabel = w.label;
        updatedItem.weightCategory = w.category;
        const declaration = declarationFromTitle(value, w.category);
        if (declaration && !isValidDeclaredValue(item.declaredValue)) {
          const converted = updatedItem.declaredCurrency === 'EUR' ? declaration.value : declaration.value / rates.EUR;
          updatedItem.declaredValue = converted.toFixed(2);
        }
      }
      
      return updatedItem;
    }));
  };

  const handleCostPriceChange = (id: string, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, costPrice: value };
      const declaration = declarationFromTitle(item.name, item.weightCategory);
      if (declaration && !isValidDeclaredValue(item.declaredValue)) {
        const converted = item.declaredCurrency === 'EUR' ? declaration.value : declaration.value / rates.EUR;
        updated.declaredValue = converted.toFixed(2);
      }
      return updated;
    }));
  };

  // Calcular frete rateado proporcional ao peso (já convertido para BRL)
  const activeItems = adjustedItems.filter(item => parseFloat(item.costPrice) > 0);
  const hasIncompleteDeclaredValues = activeItems.some(item => !isValidDeclaredValue(item.declaredValue));
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
    const declaredValue = isValidDeclaredValue(item.declaredValue) ? Number(item.declaredValue) : 0;
    const profitMargin = parseFloat(item.profitMargin) || 0;

    const costPriceBRL = convertToBRL(costPrice, item.currency);
    const itemShippingBRL = getShippingForItem(item);
    const costWithShippingBRL = costPriceBRL + itemShippingBRL;
    const declaredValueBRL = declaredValue > 0 ? convertToBRL(declaredValue, item.declaredCurrency || 'USD') : 0;
    const taxBRL = declaredValue > 0 ? declaredValueBRL * 0.60 : 0;
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
  const totalResults = hasIncompleteDeclaredValues
    ? { totalCost: 0, totalSelling: 0, totalProfit: 0 }
    : activeItems.reduce((acc, item) => {
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
    if (hasIncompleteDeclaredValues) throw new Error('Informe um valor de declaração positivo para cada item antes de exportar.');
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
      const displayName = (item.name || `Item ${index + 1}`).substring(0, 50);
      return [
        displayName,
        `${getCurrencySymbol(item.currency)} ${(parseFloat(item.costPrice) || 0).toFixed(2)}`,
        `${getCurrencySymbol(item.declaredCurrency)} ${(parseFloat(item.declaredValue) || 0).toFixed(2)}`,
        `${item.profitMargin || '0'}%`,
        `R$ ${costs.sellingPrice.toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: 90,
      head: [['Nome', 'Preço Custo', 'Valor de declaração', 'Margem', 'Preço Venda']],
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
    if (hasIncompleteDeclaredValues) throw new Error('Informe um valor de declaração positivo para cada item antes de exportar.');
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
      const displayName = (item.name || `Item ${index + 1}`).substring(0, 40);
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
    if (hasIncompleteDeclaredValues) {
      toast.error('Valores incompletos', { description: 'Informe o valor real positivo de cada item antes de exportar.' });
      return;
    }
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
    if (generatingPDF || activeItems.length === 0 || hasIncompleteDeclaredValues) return;

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
  const complianceNotice = useMemo(() => {
    if (activeItems.length === 0) return null;
    return {
      message: 'As exigências dependem do produto, da origem e da modalidade de envio. Esta calculadora não prevê seleção ou retenção pela fiscalização.',
      tip: 'Informe descrição, composição e valor conforme seus documentos e confira as instruções da transportadora e as orientações oficiais aplicáveis.',
    };
  }, [activeItems.length]);

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
        schemaVersion: 2,
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
        try { localStorage.setItem('importafacil:calc-history', JSON.stringify(next)); } catch { /* O histórico continua disponível somente durante esta sessão. */ }
        return next;
      });
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, totalShipping, shippingCurrency, totalResults.totalCost]);

  const restoreSimulation = (snapId: string) => {
    const snap = history.find((h) => h.id === snapId);
    if (!snap) return;
    const hasCurrentDeclarationValues = snap.schemaVersion === 2;
    setItems((hasCurrentDeclarationValues ? snap.items : snap.items.map((item) => ({ ...item, declaredValue: '' }))).map((item) => ({
      ...item,
      declaredCurrency: item.declaredCurrency || 'USD',
    })));
    setTotalShipping(snap.totalShipping);
    setShippingCurrency(snap.shippingCurrency);
    toast.success('Simulação restaurada!', {
      description: hasCurrentDeclarationValues
        ? snap.label
        : `${snap.label} — informe novamente os valores de declaração do histórico antigo.`,
    });
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
          {(['PLN', 'JPY', 'SAR', 'AED'] as Currency[]).map((c) => (
            <Badge key={c} variant="outline" className="text-xs font-mono">
              {CURRENCY_CONFIG[c].flag} 1 {c} = R$ {(rates.BRL / rates[c]).toFixed(2)}
            </Badge>
          ))}
        </div>
        {rateError && (
          <p className="text-xs text-muted-foreground">⚠️ Não foi possível atualizar a cotação agora. Usando os últimos valores disponíveis.</p>
        )}

        {activeItems.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4 text-accent" />
              Total informado para declaração: ${totalDeclaration.toFixed(2)} (moeda do primeiro item)
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              O valor sugerido pela IA é uma estimativa editável. Confirme sempre o valor correto e os requisitos do formulário aduaneiro utilizado.
            </p>
            {hasIncompleteDeclaredValues && (
              <p className="mt-2 flex items-start gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Preencha um valor real positivo em cada item para calcular imposto, preço final e exportar.
              </p>
            )}
          </div>
        )}

        {/* Total Shipping with Currency Selector */}
        <div data-tour="calc-inputs" className="p-3 bg-muted/50 rounded-xl space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-accent" />
            Frete Total Internacional
          </Label>
          <Select onValueChange={(v) => {
            const cur = ORIGIN_CURRENCY[Number(v)].currency;
            setShippingCurrency(cur);
            setItems((prev) => prev.map((it) => ({ ...it, currency: cur })));
          }}>
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="País do redirecionador (define a moeda)" />
            </SelectTrigger>
            <SelectContent>
              {ORIGIN_CURRENCY.map((o, i) => (
                <SelectItem key={o.label} value={String(i)}>{o.label} — {o.currency}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setItems([{ id: Date.now().toString(), name: '', costPrice: '', declaredValue: '', declaredCurrency: 'EUR', profitMargin: '30', currency: 'USD', weightCategory: 'medium', estimatedGrams: 300, weightLabel: '~300g' }]);
                  setTotalShipping('');
                  toast.success('Campos limpos', { description: 'Pronto pra uma nova simulação.' });
                }}
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Limpar todos os campos"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar campos
              </Button>
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
          </div>

          {adjustedItems.map((item, index) => {
            const costs = calculateItemCosts(item);
            const hasData = parseFloat(item.costPrice) > 0;
            const currencySymbol = getCurrencySymbol(item.currency);
            const declarationSymbol = getCurrencySymbol(item.declaredCurrency);

            return (
              <div key={item.id} className="p-3 border border-border rounded-xl bg-card space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0 text-xs flex-shrink-0">
                      {index + 1}
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

                {/* Estimated weight used for shipping allocation */}
                <div className="flex gap-2 items-center">
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    ⚖️ {item.weightLabel || '~300g'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">estimativa usada no rateio do frete</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                    <Label className="text-xs text-muted-foreground">Valor de declaração ({declarationSymbol})</Label>
                    <div className="flex gap-1">
                      <Select
                        value={item.declaredCurrency}
                        onValueChange={(v) => updateItem(item.id, 'declaredCurrency', v)}
                      >
                        <SelectTrigger className="h-8 w-[4.6rem] shrink-0 px-2 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">€ EUR</SelectItem>
                          <SelectItem value="USD">$ USD</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Sugestão da IA"
                        value={item.declaredValue}
                        onChange={(e) => updateItem(item.id, 'declaredValue', e.target.value)}
                        className="h-8 min-w-0 text-sm"
                      />
                    </div>
                    <p className="text-[10px] leading-tight text-muted-foreground">Editável após a análise da foto.</p>
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

                <ProductDescriptionAssistant
                  productName={item.name}
                  value={item.declarationDescription ?? ''}
                  onChange={(description) => updateItem(item.id, 'declarationDescription', description)}
                  onDeclarationSuggestion={({ value, currency, range, category }) => {
                    const converted = item.declaredCurrency === currency
                      ? value
                      : value / rates.EUR;
                    updateItem(item.id, 'declaredValue', converted.toFixed(2));
                    toast.success('Valor de declaração sugerido pela IA', {
                      description: `${category} · faixa ${range.min.toFixed(2)}–${range.max.toFixed(2)} EUR. Você pode editar o valor e a moeda.`,
                    });
                  }}
                />

                {hasData && (
                  <div className="pt-2 border-t border-border space-y-1">
                    {!isValidDeclaredValue(item.declaredValue) ? (
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        Informe um valor de declaração positivo em {item.declaredCurrency} para calcular imposto, preço final e lucro deste item.
                      </p>
                    ) : hasIncompleteDeclaredValues ? (
                      <p className="text-xs text-muted-foreground">
                        Complete o valor real dos demais itens ativos para exibir os resultados desta simulação.
                      </p>
                    ) : (
                      <>
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
                      </>
                    )}
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

            {/* Alerta de Saúde da Margem */}
            {totalResults.totalCost > 0 && (() => {
              const marginPct = (totalResults.totalProfit / totalResults.totalCost) * 100;
              let text = '';
              let cls = '';
              if (marginPct < 20) {
                text = '⚠️ Margem apertada para revenda.';
                cls = 'text-red-500';
              } else if (marginPct <= 50) {
                text = '👍 Boa margem de mercado.';
                cls = 'text-blue-500 dark:text-blue-400';
              } else {
                text = '🔥 Lucro espetacular!';
                cls = 'text-emerald-600 dark:text-emerald-400';
              }
              return (
                <p className={`text-xs text-center font-medium ${cls} -mt-1`}>
                  {text} <span className="opacity-60">({marginPct.toFixed(0)}%)</span>
                </p>
              );
            })()}

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
              <Button
                variant="outline"
                className="flex-1 gap-2 border-accent/30 text-accent hover:bg-accent/10"
                onClick={handleCopyResumo}
                disabled={activeItems.length === 0}
              >
                <Copy className="h-4 w-4" />
                Copiar Resumo em Texto 📋
              </Button>
            </div>
          </div>
        )}

        {complianceNotice && (
          <div className="rounded-2xl border border-border bg-muted/40 p-4 shadow-sm">
            <h4 className="mb-2 text-sm font-semibold text-foreground">Conferência de declaração</h4>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{complianceNotice.message}</p>
            <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              {complianceNotice.tip}
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

        {/* Histórico de Simulações */}
        {history.length > 0 && (
          <div className="rounded-xl border border-border bg-card/40">
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                📋 Últimas Simulações ({history.length})
              </span>
              {historyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {historyOpen && (
              <div className="px-2 pb-2 space-y-1 animate-fade-in">
                {history.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => restoreSimulation(h.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/40 hover:bg-accent/10 hover:border-accent/40 border border-transparent transition-all text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{h.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(h.savedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-muted-foreground">Lucro</p>
                      <p className={`text-xs font-bold ${h.totalProfit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                        R$ {h.totalProfit.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedPricingCalculator;
