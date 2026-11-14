import React, { useId, useRef, useState } from 'react';
import { Camera, ClipboardCopy, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { backendKey, backendUrl, getSupabaseClient, isBackendConfigured } from '@/lib/backend';
import { visionErrorMessage } from '@/lib/visionErrors';

interface ProductDescriptionAssistantProps {
  productName: string;
  value: string;
  onChange: (value: string) => void;
  onDeclarationSuggestion?: (suggestion: { value: number; currency: 'EUR' | 'USD'; range: { min: number; max: number }; category: string }) => void;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_DESCRIPTION_LENGTH = 1200;

const compressImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Não foi possível ler essa imagem.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('Não foi possível abrir essa imagem.'));
    image.onload = () => {
      const maxSide = 1200;
      const scale = Math.min(maxSide / image.width, maxSide / image.height, 1);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Não foi possível preparar a imagem neste navegador.'));
        return;
      }
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    image.src = String(reader.result ?? '');
  };
  reader.readAsDataURL(file);
});

const ProductDescriptionAssistant: React.FC<ProductDescriptionAssistantProps> = ({
  productName,
  value,
  onChange,
  onDeclarationSuggestion,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma foto em formato de imagem.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast({ title: 'Foto muito grande', description: 'Selecione uma imagem de até 10 MB.', variant: 'destructive' });
      return;
    }

    try {
      const compressed = await compressImage(file);
      setImageData(compressed);
      onChange('');
    } catch (error) {
      toast({
        title: 'Não foi possível preparar a foto',
        description: error instanceof Error ? error.message : 'Tente outra imagem.',
        variant: 'destructive',
      });
    }
  };

  const analyzeImage = async () => {
    if (!imageData || isAnalyzing) return;
    if (!user) {
      toast({ title: 'Faça login', description: 'Entre na sua conta para usar a análise por foto.', variant: 'destructive' });
      return;
    }
    if (!isBackendConfigured) {
      toast({ title: 'IA indisponível', description: 'A conexão com o serviço de IA não está configurada.', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 90000);

    try {
      const client = await getSupabaseClient();
      const { data: sessionData, error: sessionError } = await client?.auth.getSession() ?? { data: { session: null }, error: null };
      const accessToken = sessionData?.session?.access_token;
      if (sessionError || !accessToken) {
        throw new Error('Sua sessão expirou. Entre novamente e tente outra vez.');
      }

      const response = await fetch(`${backendUrl}/functions/v1/wolf-vision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: backendKey,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: [
            { type: 'text', text: productName.trim().slice(0, 160) || 'Analise este produto para a descrição da calculadora.' },
            { type: 'image_url', image_url: { url: imageData } },
          ] }],
        }),
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeoutId));

      const payload = await response.text();
      if (!response.ok) {
        let errorPayload: { error?: string; message?: string } = {};
        try { errorPayload = JSON.parse(payload); } catch { /* usa mensagem padrão */ }
        throw new Error(visionErrorMessage(errorPayload.error, response.status, errorPayload.message));
      }

      const suggestion = payload.split('\n')
        .filter((line) => line.startsWith('data:') && !line.includes('[DONE]'))
        .map((line) => {
          try { return JSON.parse(line.slice(5).trim())?.choices?.[0]?.delta?.content ?? ''; } catch { return ''; }
        })
        .join('').trim().slice(0, MAX_DESCRIPTION_LENGTH);
      if (!suggestion) throw new Error('A IA não retornou uma sugestão. Tente uma foto mais nítida.');
      onChange(suggestion);
      toast({ title: 'Sugestão pronta', description: 'Revise a descrição antes de copiar.' });
    } catch (error) {
      toast({
        title: error instanceof Error && error.name === 'AbortError' ? 'A análise demorou demais' : 'Não consegui analisar a foto',
        description: error instanceof Error && error.name === 'AbortError'
          ? 'Tente uma foto mais leve ou mais nítida.'
          : error instanceof Error ? error.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      window.clearTimeout(timeoutId);
      setIsAnalyzing(false);
    }
  };

  const copyDescription = async () => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value.trim());
      toast({ title: 'Descrição copiada' });
    } catch {
      const helper = document.createElement('textarea');
      helper.value = value.trim();
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(helper);
      if (copied) toast({ title: 'Descrição copiada' });
      else toast({ title: 'Não foi possível copiar', description: 'Selecione o texto e copie manualmente.', variant: 'destructive' });
    }
  };

  return (
    <section className="space-y-2 rounded-xl border border-border bg-muted/20 p-3" aria-label="Assistente de descrição do produto">
      <div className="space-y-1">
        <Label htmlFor={`${inputId}-description`} className="flex items-center gap-2 text-xs font-medium text-foreground">
          Descrição do produto
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
            <Sparkles className="h-3 w-3" /> IA por foto
          </span>
        </Label>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Envie uma foto nítida do produto. A IA gera uma descrição genérica para você revisar e editar.
        </p>
      </div>

      <input
        ref={fileInputRef}
        id={`${inputId}-photo`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void handleImageChange(event)}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
          <Camera className="mr-2 h-4 w-4" />
          {imageData ? 'Trocar foto' : 'Escolher foto'}
        </Button>
        {imageData && (
          <>
            <Button type="button" size="sm" onClick={() => void analyzeImage()} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isAnalyzing ? 'Analisando…' : 'Gerar sugestão'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setImageData(null); onChange(''); }}
              disabled={isAnalyzing}
              aria-label="Remover foto"
            >
              <X className="mr-1 h-4 w-4" /> Remover
            </Button>
          </>
        )}
      </div>

      {imageData && (
        <img
          src={imageData}
          alt="Prévia da foto selecionada para análise"
          className="max-h-48 max-w-full rounded-lg border border-border object-contain"
        />
      )}

      <Textarea
        id={`${inputId}-description`}
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
        maxLength={MAX_DESCRIPTION_LENGTH}
        placeholder="A sugestão factual aparecerá aqui. Revise antes de usar."
        className="min-h-24 resize-y bg-background text-sm"
      />
      <Button type="button" variant="outline" size="sm" onClick={() => void copyDescription()} disabled={!value.trim()}>
        <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar descrição
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Confirme a descrição e os requisitos da alfândega antes de declarar. A foto não determina o valor de declaração.
      </p>
    </section>
  );
};

export default ProductDescriptionAssistant;
