export function visionErrorMessage(code?: string, status?: number, message?: string): string {
  if (status === 401 || code === 'unauthorized') return 'Sua sessão expirou. Entre novamente para analisar a foto.';
  if (code === 'ai_key_missing') return 'A análise por foto ainda não está configurada. O responsável deve cadastrar a chave Gemini no campo seguro.';
  if (code === 'ai_key_invalid') return 'A configuração do Google Gemini precisa ser revisada pelo responsável pelo site.';
  if (code === 'quota_exhausted' || code === 'rate_limit' || status === 429) return 'A cota de análise de imagens foi atingida. Aguarde a renovação da cota ou contate o suporte.';
  if (code === 'model_unavailable' || code === 'vision_unavailable') return 'O modelo visual está indisponível. Tente novamente mais tarde.';
  if (code === 'payload_too_large' || status === 413) return 'A foto comprimida está muito grande. Escolha uma imagem menor, de até 10 MB antes da compressão.';
  if (code === 'invalid_image') return 'A imagem não pôde ser lida. Envie uma foto JPG, PNG ou WEBP válida.';
  if (code === 'subscription_expired') return 'Sua assinatura não tem acesso ativo à IA.';
  return message || 'Não foi possível analisar a foto agora. Tente novamente.';
}