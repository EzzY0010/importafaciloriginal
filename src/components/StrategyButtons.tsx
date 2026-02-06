import React from 'react';
import { Card } from '@/components/ui/card';

interface StrategyButtonsProps {
  onSelect?: (strategy: 'europe' | 'usa' | 'china' | 'uscloser') => void;
}

const StrategyButtons: React.FC<StrategyButtonsProps> = ({ onSelect }) => {
  const strategies = [
    {
      id: 'europe' as const,
      emoji: '🔵',
      title: 'Opção Europa',
      description: 'Garimpe na Vinted ou Wallapop. Envie para a Redirect Europa (Espanha) para evitar taxas na UE e consolidar para o Brasil.',
      color: 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10',
      platforms: ['Vinted', 'Wallapop', 'Vestiaire']
    },
    {
      id: 'usa' as const,
      emoji: '🟢',
      title: '📦 Zip4Me — Ideal para Iniciantes',
      description: 'Você ganha um endereço nos EUA para receber suas compras. Comprou? Eles recebem, embalam e enviam pro Brasil. Qualquer dúvida, é só chamar no WhatsApp — tem suporte humano em português pra te ajudar em cada etapa.',
      color: 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10',
      platforms: ['eBay', 'Outlets', 'Amazon']
    },
    {
      id: 'uscloser' as const,
      emoji: '🟡',
      title: '🏭 USCloser — Para Revendedores e Experts',
      description: 'Sistema robusto para quem já opera em escala. Galpão próprio em Utah com eficiência logística para grandes volumes de pedidos. Consolidação inteligente, rastreamento avançado e suporte dedicado para revendedores profissionais.',
      color: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10',
      platforms: ['Alto Volume', 'Revenda', 'Logística Pro']
    },
    {
      id: 'china' as const,
      emoji: '🔴',
      title: 'Opção China',
      description: 'Busque no Yupoo ou 1688. Utilize a CSSBuy como seu agente para conferir a qualidade e enviar com segurança.',
      color: 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10',
      platforms: ['Yupoo', '1688', 'Taobao']
    }
  ];

  return (
    <div className="grid gap-3">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        📦 Estratégias de Compra e Redirecionamento
      </h4>
      <div className="grid gap-2">
        {strategies.map((strategy) => (
          <Card 
            key={strategy.id}
            className={`p-3 cursor-pointer transition-all border ${strategy.color}`}
            onClick={() => onSelect?.(strategy.id)}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{strategy.emoji}</span>
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-sm text-foreground">{strategy.title}</h5>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {strategy.description}
                </p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {strategy.platforms.map((platform) => (
                    <span 
                      key={platform}
                      className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                    >
                      {platform}
                    </span>
                  ))}
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
