import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Domínios da Vinted por país com filtros de categoria
const VINTED_DOMAINS = [
  { domain: 'vinted.fr', country: 'France', lang: 'fr', code: 'FR' },
  { domain: 'vinted.de', country: 'Germany', lang: 'de', code: 'DE' },
  { domain: 'vinted.es', country: 'Spain', lang: 'es', code: 'ES' },
  { domain: 'vinted.it', country: 'Italy', lang: 'it', code: 'IT' },
  { domain: 'vinted.nl', country: 'Netherlands', lang: 'nl', code: 'NL' },
  { domain: 'vinted.be', country: 'Belgium', lang: 'fr', code: 'BE' },
  { domain: 'vinted.pt', country: 'Portugal', lang: 'pt', code: 'PT' },
  { domain: 'vinted.pl', country: 'Poland', lang: 'pl', code: 'PL' },
  { domain: 'vinted.cz', country: 'Czech Republic', lang: 'cs', code: 'CZ' },
  { domain: 'vinted.lt', country: 'Lithuania', lang: 'lt', code: 'LT' },
  { domain: 'vinted.co.uk', country: 'UK', lang: 'en', code: 'UK' },
];

// Mapeamento de categorias para IDs da Vinted (por país)
const CATEGORY_FILTERS: Record<string, string> = {
  bone: '&catalog_ids=1231', // Accessories > Hats
  tenis: '&catalog_ids=1242', // Shoes
  relogio: '&catalog_ids=1232', // Accessories > Watches
  jaqueta: '&catalog_ids=4', // Outerwear
  camiseta: '&catalog_ids=3', // Tops
  bolsa: '&catalog_ids=9', // Bags
};

interface VintedProduct {
  link: string;
  titulo: string;
  preco: string;
  imagem: string;
  vendedor: string;
  pais: string;
  score: number;
}

interface ScrapeResult {
  success: boolean;
  products: VintedProduct[];
  error?: string;
  totalSearched: number;
  domainsSearched: string[];
}

// Função para calcular score de similaridade melhorada
function calculateSimilarityScore(title: string, keywords: string[]): number {
  const titleLower = title.toLowerCase();
  let score = 0;
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    if (titleLower.includes(keywordLower)) {
      score += 10;
      // Bonus for longer keyword matches
      if (keywordLower.length > 5) {
        score += 5;
      }
      // Bonus for exact word match
      if (titleLower.split(/\s+/).includes(keywordLower)) {
        score += 8;
      }
    }
  }
  
  // Bonus for exact phrase matches
  const keywordsJoined = keywords.join(' ').toLowerCase();
  if (titleLower.includes(keywordsJoined)) {
    score += 25;
  }
  
  // Bonus for brand name matches (common brands)
  const brands = ['nike', 'adidas', 'lacoste', 'supreme', 'gucci', 'louis vuitton', 'prada', 'versace', 'fendi', 'balenciaga', 'ralph lauren', 'tommy', 'carhartt', 'north face', 'patagonia'];
  for (const brand of brands) {
    if (keywords.some(k => k.toLowerCase().includes(brand)) && titleLower.includes(brand)) {
      score += 20;
    }
  }
  
  return score;
}

// Extrair informações reais dos produtos do HTML/markdown
function extractProductsFromMarkdown(markdown: string, domain: string, keywords: string[]): VintedProduct[] {
  const products: VintedProduct[] = [];
  const domainInfo = VINTED_DOMAINS.find(d => d.domain === domain);
  const pais = domainInfo?.code || 'EU';
  
  // Pattern para links de produtos Vinted
  const productLinkPattern = /https?:\/\/[^\/]*vinted\.[^\/]+\/[^\/]+\/items\/\d+[^\s\)\]"]*/gi;
  const links = markdown.match(productLinkPattern) || [];
  
  // Remover duplicatas
  const uniqueLinks = [...new Set(links)];
  
  // Tentar extrair imagens
  const imagePattern = /https?:\/\/[^\s"'\)]+\.(jpg|jpeg|png|webp)[^\s"'\)]*/gi;
  const allImages = markdown.match(imagePattern) || [];
  
  for (const link of uniqueLinks.slice(0, 30)) {
    // Limpar o link
    const cleanLink = link.replace(/[\)\]"]+$/, '').trim();
    
    // Extrair informações do contexto ao redor do link
    const linkIndex = markdown.indexOf(link);
    const contextBefore = markdown.substring(Math.max(0, linkIndex - 400), linkIndex);
    const contextAfter = markdown.substring(linkIndex, Math.min(markdown.length, linkIndex + 200));
    const context = contextBefore + contextAfter;
    
    // Extrair título real do anúncio - várias estratégias
    let titulo = '';
    
    // Estratégia 1: Markdown link [título](url)
    const mdLinkMatch = contextBefore.match(/\[([^\]]{5,100})\]\s*$/);
    if (mdLinkMatch) {
      titulo = mdLinkMatch[1].trim();
    }
    
    // Estratégia 2: Título HTML
    if (!titulo) {
      const htmlTitleMatch = context.match(/title[=:]["']([^"']{5,100})["']/i);
      if (htmlTitleMatch) titulo = htmlTitleMatch[1].trim();
    }
    
    // Estratégia 3: Conteúdo de tag
    if (!titulo) {
      const tagMatch = context.match(/>([A-Z][^<]{10,80})</);
      if (tagMatch) titulo = tagMatch[1].trim();
    }
    
    // Estratégia 4: Texto antes do link com marca conhecida
    if (!titulo) {
      const brandPatterns = ['Nike', 'Adidas', 'Lacoste', 'Supreme', 'Gucci', 'Prada', 'Ralph Lauren', 'Tommy', 'Carhartt', 'North Face', 'New Balance', 'Jordan', 'Puma', 'Reebok', 'Vans', 'Converse'];
      for (const brand of brandPatterns) {
        const brandMatch = contextBefore.match(new RegExp(`(${brand}[^\\n]{5,60})`, 'i'));
        if (brandMatch) {
          titulo = brandMatch[1].trim();
          break;
        }
      }
    }
    
    // Fallback: usar keywords como base do título
    if (!titulo && keywords.length > 0) {
      titulo = keywords.slice(0, 3).join(' ');
    }
    
    if (!titulo) titulo = 'Produto Vinted';
    
    // Extrair preço - várias estratégias
    let preco = '';
    const pricePatterns = [
      /(\d{1,4}[.,]\d{2})\s*€/,
      /€\s*(\d{1,4}[.,]\d{2})/,
      /(\d{1,4})\s*€/,
      /€\s*(\d{1,4})/,
      /price["\s:]+(\d{1,4}[.,]?\d{0,2})/i,
    ];
    
    for (const pattern of pricePatterns) {
      const priceMatch = context.match(pattern);
      if (priceMatch) {
        preco = priceMatch[1] + '€';
        break;
      }
    }
    
    if (!preco) preco = 'Ver preço';
    
    // Tentar extrair imagem próxima ao link
    let imagem = '';
    const nearbyImages = allImages.filter(img => {
      const imgIndex = markdown.indexOf(img);
      return Math.abs(imgIndex - linkIndex) < 600;
    });
    if (nearbyImages.length > 0) {
      imagem = nearbyImages[0];
    }
    
    // Calcular score
    const score = calculateSimilarityScore(titulo, keywords);
    
    products.push({
      link: cleanLink,
      titulo,
      preco,
      imagem,
      vendedor: '',
      pais,
      score
    });
  }
  
  return products;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords, category, maxDomains = 5 } = await req.json();
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Keywords são obrigatórias' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchQuery = keywords.join(' ');
    const allProducts: VintedProduct[] = [];
    const domainsSearched: string[] = [];
    
    // Obter filtro de categoria se disponível
    const categoryFilter = category && CATEGORY_FILTERS[category.toLowerCase()] 
      ? CATEGORY_FILTERS[category.toLowerCase()] 
      : '';
    
    // Buscar em múltiplos domínios da Vinted
    const domainsToSearch = VINTED_DOMAINS.slice(0, maxDomains);
    
    console.log(`Starting search for: "${searchQuery}" in ${domainsToSearch.length} domains`);
    if (categoryFilter) {
      console.log(`Applying category filter: ${categoryFilter}`);
    }
    
    const searchPromises = domainsToSearch.map(async ({ domain, country, code }) => {
      try {
        // Construir URL com filtro de categoria se disponível
        const baseUrl = `https://www.${domain}/catalog?search_text=${encodeURIComponent(searchQuery)}`;
        const searchUrl = baseUrl + categoryFilter;
        
        console.log(`Scraping: ${searchUrl}`);
        
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: searchUrl,
            formats: ['markdown', 'links', 'html'],
            onlyMainContent: true,
            waitFor: 4000,
          }),
        });

        if (!response.ok) {
          console.error(`Firecrawl error for ${domain}: ${response.status}`);
          return { domain, products: [] };
        }

        const data = await response.json();
        
        if (data.success) {
          let products: VintedProduct[] = [];
          
          // Extrair do markdown e HTML combinados
          const markdown = data.data?.markdown || data.markdown || '';
          const html = data.data?.html || data.html || '';
          const combinedContent = markdown + '\n' + html;
          
          if (combinedContent) {
            products = extractProductsFromMarkdown(combinedContent, domain, keywords);
          }
          
          // Adicionar links extras se disponíveis
          const links = data.data?.links || data.links || [];
          if (Array.isArray(links)) {
            for (const link of links) {
              const linkUrl = typeof link === 'string' ? link : link?.url;
              const linkTitle = typeof link === 'object' ? link?.text || link?.title : '';
              
              if (linkUrl && linkUrl.includes('/items/') && !products.some(p => p.link === linkUrl)) {
                products.push({
                  link: linkUrl,
                  titulo: linkTitle || keywords.slice(0, 2).join(' ') || 'Produto Vinted',
                  preco: 'Ver preço',
                  imagem: '',
                  vendedor: '',
                  pais: code,
                  score: linkTitle ? 8 : 3
                });
              }
            }
          }
          
          if (products.length > 0) {
            domainsSearched.push(domain);
          }
          
          console.log(`Found ${products.length} products in ${domain}`);
          return { domain, products };
        }
        
        return { domain, products: [] };
      } catch (error) {
        console.error(`Error scraping ${domain}:`, error);
        return { domain, products: [] };
      }
    });

    const results = await Promise.all(searchPromises);
    
    // Consolidar todos os produtos
    for (const result of results) {
      allProducts.push(...result.products);
    }
    
    // Remover duplicatas por link
    const uniqueProducts = allProducts.reduce((acc, product) => {
      if (!acc.some(p => p.link === product.link)) {
        acc.push(product);
      }
      return acc;
    }, [] as VintedProduct[]);
    
    // Ordenar por score (maior primeiro) e depois por preço
    uniqueProducts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Se scores iguais, ordenar por preço (menor primeiro)
      const priceA = parseFloat(a.preco.replace(/[^0-9.,]/g, '').replace(',', '.')) || 999;
      const priceB = parseFloat(b.preco.replace(/[^0-9.,]/g, '').replace(',', '.')) || 999;
      return priceA - priceB;
    });
    
    // Limitar a 30 resultados
    const finalProducts = uniqueProducts.slice(0, 30);

    console.log(`Total unique products found: ${finalProducts.length}`);

    const result: ScrapeResult = {
      success: true,
      products: finalProducts,
      totalSearched: domainsSearched.length,
      domainsSearched
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Vinted scraper error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        products: [],
        totalSearched: 0,
        domainsSearched: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
