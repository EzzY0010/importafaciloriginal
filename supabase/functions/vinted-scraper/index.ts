import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Domínios da Vinted por país
const VINTED_DOMAINS = [
  { domain: 'vinted.fr', country: 'France', lang: 'fr' },
  { domain: 'vinted.de', country: 'Germany', lang: 'de' },
  { domain: 'vinted.es', country: 'Spain', lang: 'es' },
  { domain: 'vinted.it', country: 'Italy', lang: 'it' },
  { domain: 'vinted.nl', country: 'Netherlands', lang: 'nl' },
  { domain: 'vinted.be', country: 'Belgium', lang: 'fr' },
  { domain: 'vinted.pt', country: 'Portugal', lang: 'pt' },
  { domain: 'vinted.pl', country: 'Poland', lang: 'pl' },
  { domain: 'vinted.cz', country: 'Czech Republic', lang: 'cs' },
  { domain: 'vinted.lt', country: 'Lithuania', lang: 'lt' },
  { domain: 'vinted.co.uk', country: 'UK', lang: 'en' },
];

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

// Função para calcular score de similaridade
function calculateSimilarityScore(title: string, keywords: string[]): number {
  const titleLower = title.toLowerCase();
  let score = 0;
  
  for (const keyword of keywords) {
    if (titleLower.includes(keyword.toLowerCase())) {
      score += 10;
    }
  }
  
  // Bonus for exact matches
  const keywordsJoined = keywords.join(' ').toLowerCase();
  if (titleLower.includes(keywordsJoined)) {
    score += 20;
  }
  
  return score;
}

// Extrair produtos do HTML usando regex (mais resiliente)
function extractProductsFromMarkdown(markdown: string, domain: string, keywords: string[]): VintedProduct[] {
  const products: VintedProduct[] = [];
  
  // Pattern para links de produtos Vinted
  const productLinkPattern = /https?:\/\/[^\/]*vinted\.[^\/]+\/[^\/]+\/items\/\d+[^\s\)\]"]*/gi;
  const links = markdown.match(productLinkPattern) || [];
  
  // Remover duplicatas
  const uniqueLinks = [...new Set(links)];
  
  for (const link of uniqueLinks.slice(0, 20)) {
    // Extrair informações básicas do contexto
    const linkIndex = markdown.indexOf(link);
    const context = markdown.substring(Math.max(0, linkIndex - 200), Math.min(markdown.length, linkIndex + 200));
    
    // Tentar extrair título
    const titleMatch = context.match(/\[([^\]]+)\]\([^\)]*vinted/i) || 
                       context.match(/([A-Z][^.!?\n]{10,60})/);
    const titulo = titleMatch ? titleMatch[1].trim() : 'Produto Vinted';
    
    // Tentar extrair preço
    const priceMatch = context.match(/(\d+[.,]\d{2})\s*[€$£]|[€$£]\s*(\d+[.,]\d{2})/);
    const preco = priceMatch ? (priceMatch[1] || priceMatch[2]) + '€' : 'Ver preço';
    
    // Calcular score
    const score = calculateSimilarityScore(titulo, keywords);
    
    products.push({
      link: link.replace(/[\)\]"]+$/, ''), // Limpar caracteres no final
      titulo,
      preco,
      imagem: '',
      vendedor: '',
      pais: domain.replace('vinted.', '').toUpperCase(),
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
    const { keywords, maxDomains = 5 } = await req.json();
    
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
    
    // Buscar em múltiplos domínios da Vinted
    const domainsToSearch = VINTED_DOMAINS.slice(0, maxDomains);
    
    const searchPromises = domainsToSearch.map(async ({ domain, country }) => {
      try {
        const searchUrl = `https://www.${domain}/catalog?search_text=${encodeURIComponent(searchQuery)}`;
        
        console.log(`Scraping: ${searchUrl}`);
        
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: searchUrl,
            formats: ['markdown', 'links'],
            onlyMainContent: true,
            waitFor: 3000, // Esperar carregamento dinâmico
          }),
        });

        if (!response.ok) {
          console.error(`Firecrawl error for ${domain}: ${response.status}`);
          return { domain, products: [] };
        }

        const data = await response.json();
        
        if (data.success && data.markdown) {
          const products = extractProductsFromMarkdown(data.markdown, domain, keywords);
          
          // Adicionar links extras se disponíveis
          if (data.links && Array.isArray(data.links)) {
            for (const link of data.links) {
              if (link.includes('/items/') && !products.some(p => p.link === link)) {
                products.push({
                  link,
                  titulo: 'Produto Vinted',
                  preco: 'Ver preço',
                  imagem: '',
                  vendedor: '',
                  pais: domain.replace('vinted.', '').toUpperCase(),
                  score: 5
                });
              }
            }
          }
          
          domainsSearched.push(domain);
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
    
    // Ordenar por score (maior primeiro) e depois por país
    uniqueProducts.sort((a, b) => b.score - a.score);
    
    // Limitar a 30 resultados
    const finalProducts = uniqueProducts.slice(0, 30);

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
