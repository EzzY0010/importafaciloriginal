import { useEffect, useState } from "react";
import { Globe, Megaphone, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/backend";
import { DEFAULT_SITE_SETTINGS, parseSiteSettings, type SiteSettings } from "@/lib/siteSettings";
import type { Json } from "@/integrations/supabase/types";

type TextSettingKey = Exclude<keyof SiteSettings, "announcement_enabled">;

const TextField = ({
  name,
  label,
  value,
  onChange,
  multiline = false,
  hint,
}: {
  name: TextSettingKey;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
}) => (
  <div className="space-y-2">
    <Label htmlFor={`site-setting-${name}`}>{label}</Label>
    {multiline ? (
      <Textarea
        id={`site-setting-${name}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
      />
    ) : (
      <Input
        id={`site-setting-${name}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    )}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const SiteContentManager = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings>({ ...DEFAULT_SITE_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = await getSupabaseClient();
      if (!supabase) {
        if (active) {
          setLoadError("Backend indisponível. Não foi possível carregar o conteúdo salvo.");
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from("site_settings")
        .select("content, updated_at")
        .eq("id", "global")
        .maybeSingle();
      if (!active) return;
      if (error) {
        setLoadError(error.message);
      } else if (data) {
        setSettings(parseSiteSettings(data.content));
        setLastSaved(data.updated_at);
        setLoadError(null);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateField = <K extends keyof SiteSettings,>(key: K, value: SiteSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = await getSupabaseClient();
    if (!supabase) {
      setSaving(false);
      toast({ title: "Não foi possível publicar", description: "Backend indisponível.", variant: "destructive" });
      return;
    }
    const now = new Date().toISOString();
    const { error } = await supabase.from("site_settings").upsert({
      id: "global",
      content: settings as unknown as Json,
      updated_at: now,
    }, { onConflict: "id" });
    setSaving(false);
    if (error) {
      setLoadError(error.message);
      toast({ title: "Não foi possível publicar", description: error.message, variant: "destructive" });
      return;
    }
    setLoadError(null);
    setLastSaved(now);
    toast({ title: "Alterações publicadas", description: "O site público será atualizado para todos os visitantes." });
  };

  const field = (name: TextSettingKey, label: string, multiline = false, hint?: string) => (
    <TextField
      key={name}
      name={name}
      label={label}
      value={settings[name]}
      onChange={(value) => updateField(name, value)}
      multiline={multiline}
      hint={hint}
    />
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Globe className="h-5 w-5 text-primary" /> Gestão do Site
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Edite os textos públicos, avisos e ofertas sem mexer no layout. As mudanças só entram no ar quando você clicar em “Salvar e Publicar”.
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading || saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Publicando…" : "Salvar e Publicar"}
        </Button>
      </div>

      {loadError && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          A tabela de conteúdo ainda não está disponível no banco ou houve um erro ao carregar: {loadError}
        </div>
      )}
      {lastSaved && !loadError && (
        <p className="text-xs text-muted-foreground">
          Última publicação: {new Date(lastSaved).toLocaleString("pt-BR")}
        </p>
      )}
      <div role="note" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
        Os preços alterados aqui mudam o valor exibido no site. Eles não alteram a cobrança nos links de checkout já configurados; atualize também o preço no provedor de pagamento antes de publicar uma nova oferta.
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-4 w-4 text-primary" /> Aviso ou promoção no topo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label htmlFor="announcement-enabled">Exibir faixa pública</Label>
              <p className="text-xs text-muted-foreground">Quando ativada, a mensagem aparece no alto da página inicial.</p>
            </div>
            <Switch
              id="announcement-enabled"
              checked={settings.announcement_enabled}
              onCheckedChange={(checked) => updateField("announcement_enabled", checked)}
            />
          </div>
          {field("announcement_text", "Texto da faixa", true, "Deixe em branco para não mostrar nenhuma mensagem.")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Página inicial</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {field("hero_eyebrow", "Frase pequena acima do título")}
          {field("hero_title_prefix", "Título principal — primeira parte")}
          {field("hero_title_accent", "Título principal — destaque")}
          {field("hero_subtitle", "Subtítulo")}
          <div className="md:col-span-2">{field("hero_description", "Descrição principal", true)}</div>
          {field("hero_primary_cta", "Texto do botão de planos")}
          {field("hero_secondary_cta", "Texto do botão Como funciona")}
          <div className="md:col-span-2">{field("hero_microcopy", "Texto auxiliar abaixo dos botões")}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Seção “Quem somos”</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {field("about_eyebrow", "Rótulo da seção")}
          {field("about_title_prefix", "Título — primeira parte")}
          {field("about_title_accent", "Título — destaque")}
          <div className="md:col-span-2">{field("about_lead", "Frase em destaque", true)}</div>
          <div className="md:col-span-2">{field("about_description", "Descrição", true)}</div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Plano Beginners</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {field("beginners_title", "Nome do plano")}
            {field("beginners_description", "Descrição", true)}
            <div className="grid gap-4 sm:grid-cols-2">
              {field("beginners_price", "Preço exibido (ex.: 37,00)")}
              {field("beginners_period", "Período (ex.: /mês)")}
              {field("beginners_previous_price", "Preço anterior (opcional)")}
              {field("beginners_badge", "Selo promocional (opcional)")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Plano Elite</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {field("elite_title", "Nome do plano")}
            {field("elite_description", "Descrição", true)}
            <div className="grid gap-4 sm:grid-cols-2">
              {field("elite_price", "Preço exibido (ex.: 497,00)")}
              {field("elite_period", "Período / condição")}
              {field("elite_previous_price", "Preço anterior (opcional)")}
              {field("elite_badge", "Selo promocional (opcional)")}
            </div>
            {field("elite_included_benefit", "Benefício em destaque (opcional)")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Plano Conexão USA</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {field("usa_title", "Nome do plano")}
            {field("usa_description", "Descrição", true)}
            <div className="grid gap-4 sm:grid-cols-2">
              {field("usa_price", "Preço exibido (ex.: 120,00)")}
              {field("usa_period", "Período (ex.: /mês)")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contato público</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {field("whatsapp_number", "WhatsApp com código do país", false, "Somente números, incluindo DDI. Exemplo: 5511999999999. Se ficar vazio, o botão não aparece.")}
            {field("whatsapp_label", "Texto do botão")}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">Links de checkout, layout, login e permissões não são alterados por este editor.</p>
        <Button onClick={handleSave} disabled={loading || saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Publicando…” : "Salvar e Publicar"}
        </Button>
      </div>
    </div>
  );
};

export default SiteContentManager;
