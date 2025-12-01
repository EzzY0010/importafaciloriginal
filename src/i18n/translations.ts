export type Language = 'pt' | 'zh';

export const translations = {
  pt: {
    // Common
    appName: 'ImportaFacil',
    tagline: 'Importação Simplificada',
    
    // Auth
    login: 'Entrar',
    signup: 'Cadastrar',
    logout: 'Sair',
    email: 'Email',
    password: 'Senha',
    confirmPassword: 'Confirmar senha',
    fullName: 'Nome completo',
    enterYourAccount: 'Entre na sua conta',
    createYourAccount: 'Crie sua conta',
    noAccount: 'Não tem conta?',
    hasAccount: 'Já tem conta?',
    signupNow: 'Cadastre-se',
    loginNow: 'Entrar',
    
    // Pricing
    pricing: 'Preço',
    fixedPrice: 'Preço Fixo',
    perAccess: 'por acesso',
    subscribe: 'Assinar Agora',
    features: 'Recursos incluídos',
    feature1: 'Acesso completo à plataforma',
    feature2: 'Suporte ao cliente 24/7',
    feature3: 'Atualizações gratuitas',
    feature4: 'Sem taxas escondidas',
    
    // Dashboard
    dashboard: 'Painel',
    welcome: 'Bem-vindo',
    admin: 'Administrador',
    user: 'Usuário',
    
    // Messages
    loginSuccess: 'Login realizado!',
    welcomeBack: 'Bem-vindo ao ImportaFacil',
    accountCreated: 'Conta criada!',
    passwordMismatch: 'As senhas não coincidem',
    error: 'Erro',
  },
  zh: {
    // Common
    appName: 'ImportaFacil',
    tagline: '简化进口',
    
    // Auth
    login: '登录',
    signup: '注册',
    logout: '退出',
    email: '电子邮件',
    password: '密码',
    confirmPassword: '确认密码',
    fullName: '全名',
    enterYourAccount: '登录您的账户',
    createYourAccount: '创建您的账户',
    noAccount: '没有账户？',
    hasAccount: '已有账户？',
    signupNow: '立即注册',
    loginNow: '登录',
    
    // Pricing
    pricing: '价格',
    fixedPrice: '固定价格',
    perAccess: '每次访问',
    subscribe: '立即订阅',
    features: '包含功能',
    feature1: '完整平台访问',
    feature2: '24/7客户支持',
    feature3: '免费更新',
    feature4: '无隐藏费用',
    
    // Dashboard
    dashboard: '仪表板',
    welcome: '欢迎',
    admin: '管理员',
    user: '用户',
    
    // Messages
    loginSuccess: '登录成功！',
    welcomeBack: '欢迎来到ImportaFacil',
    accountCreated: '账户已创建！',
    passwordMismatch: '密码不匹配',
    error: '错误',
  },
} as const;

export type TranslationKey = keyof typeof translations.pt;
