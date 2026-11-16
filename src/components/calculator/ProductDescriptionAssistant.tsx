import React, { useEffect, useRef } from 'react';
import { ClipboardCopy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ProductDescriptionAssistantProps {
  productName: string;
  value: string;
  onChange: (value: string) => void;
  onDeclarationSuggestion?: (suggestion: { value: number; currency: 'EUR' | 'USD'; range: { min: number; max: number }; category: string }) => void;
}

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const descriptionFromTitle = (title: string) => {
  const name = normalize(title);
  if (!name) return '';
  if (/\b(bone|chapeu|cap|bucket)\b/.test(name)) return 'Boné de tecido leve';
  if (/velejad/.test(name)) return 'Blusa tipo velejador';
  if (/\b(jaqueta|corta[- ]?vento|windbreaker|puffer|parka)\b/.test(name)) return /corta[- ]?vento|windbreaker/.test(name) ? 'Jaqueta corta-vento' : 'Jaqueta esportiva para o dia a dia';
  if (/\b(blusa|moletom|hoodie|casaco|anorak)\b/.test(name)) return 'Blusa de frio';
  if (/\b(camiseta|t-shirt|tee|regata)\b/.test(name)) return 'Camiseta de tecido leve';
  if (/\b(bermuda|shorts)\b/.test(name)) return 'Bermuda de tecido leve';
  if (/\b(calca|jeans)\b/.test(name)) return 'Calça de tecido';
  if (/\b(tenis|sapato|calcado|sandalia)\b/.test(name)) return 'Calçado de uso pessoal';
  if (/\b(bolsa|mochila)\b/.test(name)) return 'Bolsa de uso pessoal';
  return 'Produto de uso pessoal';
};

const ProductDescriptionAssistant: React.FC<ProductDescriptionAssistantProps> = ({ productName, value, onChange }) => {
  const { toast } = useToast();
  const lastAutomatic = useRef('');
  useEffect(() => {
    const generated = descriptionFromTitle(productName);
    if (generated && (!value.trim() || value === lastAutomatic.current)) {
      lastAutomatic.current = generated;
      onChange(generated);
    }
  }, [productName]);
  const copyDescription = async () => {
    if (!value.trim()) return;
    try { await navigator.clipboard.writeText(value.trim()); toast({ title: 'Descrição copiada' }); }
    catch { toast({ title: 'Não foi possível copiar', description: 'Selecione a descrição e copie manualmente.', variant: 'destructive' }); }
  };
  return (
    <section className="space-y-2 rounded-xl border border-border bg-muted/20 p-3" aria-label="Descrição automática do produto">
      <div className="space-y-1">
        <Label htmlFor="product-description" className="flex items-center gap-2 text-xs font-medium text-foreground">
          Descrição do produto
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent"><Sparkles className="h-3 w-3" /> Automática pelo título</span>
        </Label>
        <p className="text-xs leading-relaxed text-muted-foreground">A descrição é criada pela categoria do título, sem marcas ou logotipos. Você pode editar.</p>
      </div>
      <Textarea id="product-description" value={value} onChange={(event) => onChange(event.target.value.slice(0, 1200))} maxLength={1200} placeholder="Digite o título do produto para gerar a descrição." className="min-h-20 resize-y bg-background text-sm" />
      <Button type="button" variant="outline" size="sm" onClick={() => void copyDescription()} disabled={!value.trim()}><ClipboardCopy className="mr-2 h-4 w-4" /> Copiar descrição</Button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">O valor de declaração é preenchido automaticamente pela categoria e continua editável.</p>
    </section>
  );
};
export default ProductDescriptionAssistant;
