import React from 'react';
import { Card } from '@/components/ui/card';

interface StrategyButtonsProps {
  onSelect?: (strategy: 'usa' | 'europe' | 'uk' | 'china') => void;
}

type Strategy = {
  id: 'usa' | 'europe' | 'uk' | 'china';
  emoji: string;
  title: string;
  description: string;
  color: string;
  dotColor: string;
  redirectors: string[];
  sources: string[];
  tip: string;
};

const StrategyButtons: React.FC<StrategyButtonsProps> = ({ onSelect }) => {
  const strategies: Strategy[] = [
    {
      id: 'usa',
      emoji: '🟢',
      title: 'Fonte Estados Unidos (USA)',
      description:
        'O maior catálogo do mundo: grifes, outlets oficiais, eletrônicos, sneakers e luxo. Combine compras tax-free com redirecionadoras de confiança para escalar margens.',
      color: 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10',
      dotColor: 'bg-green-500',
      redirectors: [
        'Zip4Me',
        'USCloser',
        'Fishisfast',
        'Qwintry',
        'Planet Express',
        'GoBox USA',
        'Shipito',
        'MyUS',
        'Stackry',
      ],
      sources: [
        'eBay',
        'Amazon',
        'StockX',
        'GOAT',
        'Grailed',
        'Jomashop',
        '6pm',
        'Zappos',
        "Macy's",
        'Nordstrom',
        "Bloomingdale's",
        'Tommy Hilfiger Outlet',
        'Lacoste US',
        'Armani Exchange',
        'Hugo Boss US',
        'Ralph Lauren',
        'Nike',
        'Adidas',
        "Carter's",
      ],
      tip: 'Operação Tax-Free: use armazéns em Delaware ou Oregon (estados sem sales tax) para zerar o imposto americano interno. A diferença de 6% a 10% no checkout vira margem direta ao consolidar com a redirecionadora.',
    },
    {
      id: 'europe',
      emoji: '🔵',
      title: 'Fonte Europa (Espanha & Portugal)',
      description:
        'O paraíso do garimpo premium e desapegos de luxo. Consolide na Espanha ou Portugal para evitar taxas internas da UE e otimizar o frete até o Brasil.',
      color: 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10',
      dotColor: 'bg-blue-500',
      redirectors: [
        'Redirect Europa',
        'EuroSender',
        'Brapci',
        'Shoptomydoor Europe',
        'forward2me',
      ],
      sources: [
        'Vinted Espanha',
        'Vinted França',
        'Vinted Portugal',
        'Wallapop',
        'Vestiaire Collective',
        'Depop',
        'Klekt',
        'StockX Europe',
        'Zalando',
        'Zalando Privé',
        'ASOS',
        'Yoox',
        'Farfetch',
        'Lacoste EU',
        'Hugo Boss EU',
        'Armani EU',
      ],
      tip: 'Garimpo premium: Vinted e Wallapop estão lotados de peças de grife com desapegos a 30%-70% do valor original. Centralize tudo em um endereço na Espanha, peça consolidação e envie um único pacote para reduzir frete e risco de tributação.',
    },
    {
      id: 'uk',
      emoji: '🇬🇧',
      title: 'Fonte Reino Unido (UK)',
      description:
        'Pós-Brexit, o UK virou um mercado isolado com preços agressivos em streetwear, esportivos e luxo. Envie sempre direto do UK para o Brasil, nunca via Europa.',
      color: 'border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10',
      dotColor: 'bg-indigo-500',
      redirectors: ['forward2me UK', 'UK Postbox', 'MyUKMailbox', 'ForwardVia'],
      sources: [
        'eBay UK',
        'Depop UK',
        'Sports Direct',
        'ASOS UK',
        'Mainline Menswear',
        'END. Clothing',
        'Flannels',
        'Selfridges',
        'JD Sports',
      ],
      tip: 'Alerta Brexit: compras feitas em sites do UK e enviadas para um endereço na União Europeia sofrem dupla tributação (VAT + import duty). Use sempre uma redirecionadora baseada no próprio Reino Unido para despachar direto ao Brasil.',
    },
    {
      id: 'china',
      emoji: '🔴',
      title: 'Fonte China & Ásia',
      description:
        'Réplicas premium, fábricas diretas e eletrônicos com margens absurdas. Use agentes de compra para QC, consolidação e linhas de envio seguras.',
      color: 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10',
      dotColor: 'bg-red-500',
      redirectors: [
        'CSSBuy',
        'Superbuy',
        'Sugargoo',
        'Kameymall',
        'Basetao',
        'HubBuyCN',
        'CNFans',
      ],
      sources: [
        'Yupoo (álbuns)',
        '1688',
        'Taobao',
        'Weidian',
        'AliExpress',
        'Alibaba',
        'Made-in-China',
      ],
      tip: 'Ecossistema de agentes: o agente compra para você (sites que não aceitam cartão internacional), tira fotos de QC (controle de qualidade), pesa o pacote, armazena de graça por até 90 dias e oferece linhas de envio segmentadas — expressas, seguras para marcas e econômicas. Sempre peça QC antes de enviar.',
    },
  ];

  const renderBadges = (items: string[]) => (
    <div className="flex gap-1.5 flex-wrap">
      {items.map((item) => (
        <span
          key={item}
          className="text-[11px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground border border-border/50"
        >
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div className="grid gap-3">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        📦 Estratégias de Compra e Redirecionamento
      </h4>
      <div className="grid gap-3">
        {strategies.map((strategy) => (
          <Card
            key={strategy.id}
            className={`p-4 cursor-pointer transition-all border rounded-2xl shadow-sm hover:shadow-md ${strategy.color}`}
            onClick={() => onSelect?.(strategy.id)}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-1 w-3.5 h-3.5 rounded-full flex-shrink-0 ${strategy.dotColor} shadow`}
                aria-hidden
              />
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h5 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <span>{strategy.emoji}</span>
                    <span>{strategy.title}</span>
                  </h5>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {strategy.description}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                    Redirecionadoras / Agentes
                  </p>
                  {renderBadges(strategy.redirectors)}
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                    Sites & Fontes de Compra
                  </p>
                  {renderBadges(strategy.sources)}
                </div>

                <div className="rounded-lg bg-background/60 border border-border/60 p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70 mb-1">
                    💡 Dica de Operação
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {strategy.tip}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StrategyButtons;
