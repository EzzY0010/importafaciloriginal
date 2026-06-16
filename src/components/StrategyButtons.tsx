import React from 'react';
import { Card } from '@/components/ui/card';

interface StrategyButtonsProps {
  onSelect?: (strategy: 'usa' | 'europe' | 'uk' | 'china') => void;
}

type Redirector = {
  name: string;
  support: 'pt-br' | 'en';
  note?: string;
};

type Strategy = {
  id: 'usa' | 'europe' | 'uk' | 'china';
  emoji: string;
  title: string;
  description: string;
  color: string;
  dotColor: string;
  redirectors: Redirector[];
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
        { name: 'Zip4Me', support: 'pt-br', note: 'Suporte humanizado em português via WhatsApp — referência para quem está começando.' },
        { name: 'USCloser', support: 'pt-br', note: 'Atendimento em PT-BR no WhatsApp. Armazém em Utah (sem sales tax), ideal para operações em escala.' },
        { name: 'ViajaBox', support: 'pt-br', note: 'Suporte em português via WhatsApp e e-mail. Uma das mais populares entre brasileiros, com seguro e fotos do pacote inclusos.' },
        { name: 'Shipito', support: 'en', note: 'Suporte estritamente em inglês via chat. Player consolidado, opera há décadas.' },
        { name: 'MyUS', support: 'en', note: 'Suporte em inglês. Modelo de assinatura com tarifas competitivas em grandes volumes.' },
        { name: 'Stackry', support: 'en', note: 'Armazém em New Hampshire (sem sales tax). Atendimento em inglês via chat e e-mail.' },
        { name: 'Planet Express', support: 'en', note: 'Oregon (sem sales tax). Atendimento em inglês.' },
      ],
      sources: [
        'eBay',
        'Amazon',
        'StockX',
        'GOAT',
        'Grailed',
        '6pm',
        'Zappos',
        "Macy's",
        'Nordstrom',
        'Ralph Lauren',
        'Nike',
        'Adidas',
      ],
      tip: 'Operação Tax-Free: use armazéns em Delaware, New Hampshire ou Oregon (estados sem sales tax) para zerar o imposto americano interno. A diferença de 6% a 10% no checkout vira margem direta ao consolidar com a redirecionadora.',
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
        { name: 'Redirect Europa', support: 'pt-br', note: 'Suporte humanizado em português via WhatsApp. Armazém na Espanha — referência para brasileiros operando na UE.' },
        { name: 'Eurosender', support: 'en', note: 'Plataforma de envios pan-europeia. Atendimento em inglês via chat e e-mail.' },
      ],
      sources: [
        'Vinted Espanha',
        'Vinted França',
        'Vinted Portugal',
        'Wallapop',
        'Vestiaire Collective',
        'Zalando',
        'Zalando Privé',
        'Farfetch',
      ],
      tip: 'Garimpo premium: Vinted, Wallapop e Vestiaire Collective estão lotados de peças de grife com desapegos a 30%-70% do valor original. Centralize tudo em um endereço na Espanha, peça consolidação e envie um único pacote para reduzir frete e risco de tributação.',
    },
    {
      id: 'uk',
      emoji: '🇬🇧',
      title: 'Fonte Reino Unido (UK)',
      description:
        'Pós-Brexit, o UK virou um mercado isolado com preços agressivos em streetwear, esportivos e luxo. Envie sempre direto do UK para o Brasil, nunca via Europa.',
      color: 'border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10',
      dotColor: 'bg-indigo-500',
      redirectors: [
        { name: 'ForwardVia', support: 'pt-br', note: 'Suporte em português via WhatsApp. A redirecionadora mais usada por brasileiros no Reino Unido.' },
        { name: 'forward2me UK', support: 'en', note: 'Suporte em inglês via chat. Armazém em Hemel Hempstead, processa grandes volumes.' },
        { name: 'UK Postbox', support: 'en', note: 'Atendimento em inglês. Endereço em Londres com digitalização de correspondências.' },
      ],
      sources: [
        'eBay UK',
        'Vinted UK',
        'Sports Direct',
        'ASOS UK',
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
        { name: 'CSSBuy', support: 'en', note: 'Agente veterano com suporte em inglês via chat. Referência em QC para réplicas.' },
        { name: 'Superbuy', support: 'en', note: 'Plataforma completa com app próprio. Suporte em inglês 24/7.' },
        { name: 'Sugargoo', support: 'en', note: 'Suporte em inglês via chat. Forte em consolidação e linhas de envio segmentadas.' },
        { name: 'CNFans', support: 'en', note: 'Agente popular entre repsneakerheads. Suporte em inglês via Discord e chat.' },
        { name: 'Joyabuy', support: 'en', note: 'Sucessor direto do antigo Pandabuy. Suporte em inglês via chat e Discord.' },
      ],
      sources: [
        'Yupoo (álbuns)',
        '1688',
        'Taobao',
        'Weidian',
        'DHgate',
      ],
      tip: 'Ecossistema de agentes: o agente compra para você (sites que não aceitam cartão internacional), tira fotos de QC (controle de qualidade), pesa o pacote, armazena de graça por até 90 dias e oferece linhas de envio segmentadas — expressas, seguras para marcas e econômicas. Sempre peça QC antes de enviar.',
    },
  ];

  const sortedRedirectors = (list: Redirector[]) => {
    const weight = { 'pt-br': 0, en: 1 } as const;
    return [...list].sort((a, b) => weight[a.support] - weight[b.support]);
  };

  const supportBadge = (support: Redirector['support']) => {
    if (support === 'pt-br') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#25D366]/15 text-[#1ea952] border border-[#25D366]/30">
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Suporte WhatsApp PT-BR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
        Suporte em inglês
      </span>
    );
  };

  const renderRedirectors = (list: Redirector[]) => (
    <div className="grid gap-2">
      {sortedRedirectors(list).map((r) => (
        <div
          key={r.name}
          className={`rounded-lg border p-2 ${
            r.support === 'pt-br'
              ? 'border-[#25D366]/40 bg-[#25D366]/5'
              : 'border-border/60 bg-background/60'
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold text-foreground">{r.name}</span>
            {supportBadge(r.support)}
          </div>
          {r.note && (
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{r.note}</p>
          )}
        </div>
      ))}
    </div>
  );

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
                  {renderRedirectors(strategy.redirectors)}
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