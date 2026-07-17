export type SourceItem = {
  name: string;
  url: string;
  country: string;
  flag: string;
  description: string;
};

export const SOURCES: SourceItem[] = [
  { name: "DHgate", url: "https://www.dhgate.com", country: "China", flag: "🇨🇳", description: "Marketplace de réplicas e atacado direto de fábrica." },
  { name: "Yupoo", url: "https://x.yupoo.com", country: "China", flag: "🇨🇳", description: "Catálogo em álbuns de fotos reais dos fornecedores." },
  { name: "Xianyu (Taobao 2)", url: "https://2.taobao.com", country: "China", flag: "🇨🇳", description: "Desapegos chineses e produtos usados premium." },
  { name: "1688", url: "https://www.1688.com", country: "China", flag: "🇨🇳", description: "Atacado direto de fábrica a preço de custo." },
  { name: "Taobao", url: "https://www.taobao.com", country: "China", flag: "🇨🇳", description: "O maior varejo interno chinês." },
  { name: "Vinted", url: "https://www.vinted.com", country: "Europa", flag: "🇪🇺", description: "Roupas e moda usada/vintage com garimpo premium." },
  { name: "Depop", url: "https://www.depop.com", country: "Europa", flag: "🇪🇺", description: "Vitrine de streetwear jovem e peças raras." },
  { name: "Vestiaire Collective", url: "https://www.vestiairecollective.com", country: "França", flag: "🇫🇷", description: "Luxo de elite certificado por especialistas." },
  { name: "Wallapop", url: "https://es.wallapop.com", country: "Espanha", flag: "🇪🇸", description: "Eletrônicos e desapegos locais espanhóis." },
  { name: "Milanuncios", url: "https://www.milanuncios.com", country: "Espanha", flag: "🇪🇸", description: "Classificados gerais para todo tipo de garimpo." },
  { name: "eBay", url: "https://www.ebay.com", country: "EUA", flag: "🇺🇸", description: "Leilões, usados e eletrônicos premium." },
  { name: "Grailed", url: "https://www.grailed.com", country: "EUA", flag: "🇺🇸", description: "Moda masculina de luxo e streetwear." },
  { name: "Secret Sales", url: "https://www.secretsales.com", country: "Reino Unido", flag: "🇬🇧", description: "Outlet de grifes com até 80% OFF." },
  { name: "Sports Direct", url: "https://www.sportsdirect.com", country: "Reino Unido", flag: "🇬🇧", description: "Chuteiras e artigos esportivos a preço agressivo." },
  { name: "USC", url: "https://www.usc.co.uk", country: "Reino Unido", flag: "🇬🇧", description: "Streetwear e marcas premium do UK." },
  { name: "JD Sports", url: "https://www.jdsports.co.uk", country: "Reino Unido / EUA", flag: "🇬🇧", description: "Tênis e collabs exclusivas — fonte de elite." },
  { name: "Lefties", url: "https://www.lefties.com", country: "Espanha", flag: "🇪🇸", description: "Outlet oficial do grupo Zara." },
  { name: "Zalando Lounge", url: "https://www.zalando-lounge.com", country: "Europa", flag: "🇪🇺", description: "Clube de vendas privadas com grifes." },
  { name: "Zalando Privé", url: "https://www.zalando-prive.es", country: "Espanha", flag: "🇪🇸", description: "Grifes de luxo com desconto." },
  { name: "Vinted UK", url: "https://www.vinted.co.uk", country: "Reino Unido", flag: "🇬🇧", description: "Marcas inglesas em garimpo direto." },
];

export const REDIRECTORS: SourceItem[] = [
  { name: "WeZip4U", url: "https://www.wezip4u.com", country: "EUA", flag: "🇺🇸", description: "Foco no público brasileiro, suporte próximo." },
  { name: "Zip4Me", url: "https://www.zip4me.com", country: "EUA", flag: "🇺🇸", description: "Excelente para iniciantes, PT-BR no WhatsApp." },
  { name: "USCloser", url: "https://www.uscloser.com", country: "EUA", flag: "🇺🇸", description: "Otimizada para redirecionamentos em escala." },
  { name: "ViajaBox", url: "https://www.viajabox.com", country: "EUA", flag: "🇺🇸", description: "Suporte rápido via WhatsApp em português." },
  { name: "Redirect Europa", url: "https://www.redirecteuropa.com", country: "Espanha / Europa", flag: "🇪🇺", description: "Consolidação e envio direto para o Brasil." },
  { name: "CSSBuy", url: "https://www.cssbuy.com", country: "China", flag: "🇨🇳", description: "Agente de compras oficial com QC confiável." },
  { name: "ForwardVia", url: "https://www.forwardvia.com", country: "Reino Unido", flag: "🇬🇧", description: "Envio rápido da Europa/UK para o Brasil." },
  { name: "UK2Brazil", url: "https://www.uk2brazil.com", country: "Reino Unido", flag: "🇬🇧", description: "Suporte focado em brasileiros no UK." },
];