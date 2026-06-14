export function translateAuthError(message: string | undefined | null): string {
  if (!message) return 'Ocorreu um erro. Tente novamente.';
  const msg = message.toLowerCase();

  if (msg.includes('user already registered') || msg.includes('already been registered') || msg.includes('already registered')) {
    return 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('email not confirmed')) {
    return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
  }
  if (msg.includes('invalid email') || msg.includes('email address') && msg.includes('invalid')) {
    return 'E-mail inválido. Verifique e tente novamente.';
  }
  if (msg.includes('password should be at least') || msg.includes('password is too short')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (msg.includes('weak password') || msg.includes('password is too weak')) {
    return 'Senha muito fraca. Use letras, números e símbolos.';
  }
  if (msg.includes('pwned') || msg.includes('compromised')) {
    return 'Esta senha apareceu em vazamentos de dados. Escolha outra senha.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (msg.includes('user not found')) {
    return 'Usuário não encontrado.';
  }
  if (msg.includes('signup') && msg.includes('disabled')) {
    return 'Cadastros estão temporariamente desativados.';
  }
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return 'Falha de conexão. Verifique sua internet e tente novamente.';
  }
  if (msg.includes('token') && msg.includes('expired')) {
    return 'Sessão expirada. Faça login novamente.';
  }
  if (msg.includes('new password should be different')) {
    return 'A nova senha deve ser diferente da senha atual.';
  }
  if (msg.includes('email link is invalid') || msg.includes('otp') && msg.includes('expired')) {
    return 'Link inválido ou expirado. Solicite um novo.';
  }

  return message;
}
