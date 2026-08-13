import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/backend";

interface StoredFile { name: string; size: number | null }

const MinicursoFiles = () => {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = await getSupabaseClient();
      if (!client) return;
      const { data, error } = await client.storage.from("minicurso").list("", { limit: 100 });
      if (error) throw error;
      setFiles(
        (data ?? [])
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .map((f) => ({ name: f.name, size: f.metadata?.size ?? null }))
      );
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao listar arquivos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      const client = await getSupabaseClient();
      if (!client) return;
      for (const file of Array.from(fileList)) {
        const { error } = await client.storage
          .from("minicurso")
          .upload(file.name, file, { upsert: true, contentType: file.type || "application/pdf" });
        if (error) throw error;
      }
      toast({ title: "Upload concluído" });
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Falha no upload", description: "Verifique se você é administrador.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (name: string) => {
    try {
      const client = await getSupabaseClient();
      if (!client) return;
      const { error } = await client.storage.from("minicurso").remove([name]);
      if (error) throw error;
      toast({ title: "Arquivo removido" });
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao remover arquivo", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">Arquivos do Minicurso ({files.length})</CardTitle>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button size="sm" disabled={uploading} onClick={() => inputRef.current?.click()} className="gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Enviar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum PDF enviado ainda.</p>
        ) : (
          files.map((f) => (
            <div key={f.name} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground truncate">{f.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(f.name)} aria-label="Remover">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default MinicursoFiles;
