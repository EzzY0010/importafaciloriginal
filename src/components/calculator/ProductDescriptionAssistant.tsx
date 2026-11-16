import React, { useEffect, useRef, useState } from 'react';
import { ClipboardCopy, ImagePlus, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/backend';

interface ProductDescriptionAssistantProps {
  productName: string;
  value: string;
  onChange: (value: string) => void;
  onDeclarationSuggestion?: (suggestion: { value: number; currency: 'EUR' | 'USD'; range: { min: number; max: number }; category: string }) => void;
}

const MAX_ORIGINAL_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_COMPRESSED_BASE64_SIZE = 4_194_304;

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

const compressImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Não foi possível abrir essa imagem.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('A imagem não pôde ser carregada.'));
    image.onload = () => {
      const scale = Math.min(900 / image.naturalWidth, 900 / image.naturalHeight, 1);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Não foi possível preparar a imagem neste dispositivo.'));
        return;
      }
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL('image/jpeg', 0.68);
        const base64 = compressed.split(',')[1] ?? '';
        if (base64.length > MAX_COMPRESSED_BASE64_SIZE) {
          reject(new Error('A foto continua grande após a compressão. Escolha uma imagem menor.'));
          return;
        }
        resolve(compressed);
      } catch {
        reject(new Error('Não foi possível comprimir a imagem.'));
      }
    };
    image.src = String(reader.result ?? '');
  };
  reader.readAsDataURL(file);
});

const ProductDescriptionAssistant: React.FC<ProductDescriptionAssistantProps> = ({ productName, value, onChange }) => {
  const { toast } = useToast();
  const lastAutomatic = useRef('');
  const latestValue = useRef(value);
  const onChangeRef = useRef(onChange);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const generated = descriptionFromTitle(productName);
    const currentValue = latestValue.current;
    if (generated && (!currentValue.trim() || currentValue === lastAutomatic.current)) {
      lastAutomatic.current = generated;
      latestValue.current = generated;
      onChangeRef.current(generated);
    }
  }, [productName]);

  const analyzeImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: 'Formato não suportado', description: 'Escolha uma foto JPG, PNG ou WEBP.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_ORIGINAL_IMAGE_SIZE) {
      toast({ title: 'Foto muito grande', description: 'Selecione uma imagem de até 10 MB.', variant: 'destructive' });
      return;
    }

    const descriptionAtStart = latestValue.current;
    setIsAnalyzing(true);
    try {
      const client = await getSupabaseClient();
      if (!client) throw new Error('A calculadora está indisponível no momento. Tente novamente mais tarde.');
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error('Entre novamente na sua conta para analisar uma foto.');
      }

      const imageData = await compressImage(file);
      const { data, error } = await client.functions.invoke('product-description', { body: { imageData } });
      if (error) {
        const response = (error as { context?: Response }).context;
        const payload = response instanceof Response ? await response.clone().json().catch(() => null) : null;
        const message = payload && typeof payload.message === 'string'
          ? payload.message
          : 'Não foi possível ler a foto agora. Tente outra imagem mais nítida.';
        console.error('product-description request failed');
        throw new Error(message);
      }

      const suggestion = typeof data?.suggestion === 'string' ? data.suggestion.trim() : '';
      if (!suggestion) {
        throw new Error(typeof data?.message === 'string' ? data.message : 'A análise não retornou uma descrição. Tente outra foto.');
      }
      if (normalize(suggestion).startsWith('produto nao identificavel')) {
        toast({ title: 'Produto não identificado', description: 'Tente uma foto mais nítida, mostrando o produto inteiro.', variant: 'destructive' });
        return;
      }
      if (latestValue.current !== descriptionAtStart) {
        toast({ title: 'Descrição preservada', description: 'O texto foi editado durante a leitura; a sugestão da foto não o substituiu.' });
        return;
      }

      lastAutomatic.current = '';
      const nextValue = suggestion.slice(0, 1200);
      latestValue.current = nextValue;
      onChange(nextValue);
      toast({ title: 'Descrição sugerida pela foto', description: 'Revise o material aparente antes de usar na declaração.' });
    } catch (error) {
      toast({
        title: 'Não foi possível ler a foto',
        description: error instanceof Error ? error.message : 'Tente outra imagem mais nítida.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyDescription = async () => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value.trim());
      toast({ title: 'Descrição copiada' });
    } catch {
      toast({ title: 'Não foi possível copiar', description: 'Selecione a descrição e copie manualmente.', variant: 'destructive' });
    }
  };

  return (
    <section className="space-y-2 rounded-xl border border-border bg-muted/20 p-3" aria-label="Descrição para a declaração">
      <div className="space-y-1">
        <Label htmlFor="product-description" className="flex items-center gap-2 text-xs font-medium text-foreground">
          Descrição para a declaração
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent"><Sparkles className="h-3 w-3" /> Sugestão automática</span>
        </Label>
        <p className="text-xs leading-relaxed text-muted-foreground">A descrição pode ser sugerida pelo título ou pela leitura da foto. Confira e edite antes de declarar.</p>
      </div>
      <Textarea id="product-description" value={value} onChange={(event) => onChange(event.target.value.slice(0, 1200))} maxLength={1200} placeholder="Ex.: Boné de tecido leve" className="min-h-20 resize-y bg-background text-sm" />
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={analyzeImage} className="hidden" aria-label="Selecionar foto do produto" />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          {isAnalyzing ? 'Lendo foto...' : 'Ler foto e sugerir material'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void copyDescription()} disabled={!value.trim()}>
          <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar descrição
        </Button>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">A foto sugere apenas a aparência do material; não confirma composição. Verifique a etiqueta ou o fornecedor. O valor da declaração continua separado e editável.</p>
    </section>
  );
};

export default ProductDescriptionAssistant;
