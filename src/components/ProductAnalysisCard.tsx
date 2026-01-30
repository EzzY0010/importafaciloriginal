import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Scale, Lightbulb, Tag } from 'lucide-react';

interface ProductAnalysis {
  name: string;
  brand: string;
  composition?: string;
  weight?: string;
  tip?: string;
  priceRange?: string;
  keywords?: string[];
}

interface ProductAnalysisCardProps {
  analysis: ProductAnalysis;
}

const ProductAnalysisCard: React.FC<ProductAnalysisCardProps> = ({ analysis }) => {
  return (
    <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-foreground">{analysis.name}</h4>
            <p className="text-sm text-muted-foreground">{analysis.brand}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {analysis.composition && (
            <div className="flex items-start gap-2">
              <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Composição</p>
                <p className="text-sm font-medium">{analysis.composition}</p>
              </div>
            </div>
          )}
          {analysis.weight && (
            <div className="flex items-start gap-2">
              <Scale className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Peso Estimado</p>
                <p className="text-sm font-medium">{analysis.weight}</p>
              </div>
            </div>
          )}
        </div>

        {/* Wolf Tip */}
        {analysis.tip && (
          <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-accent">Curiosidade do Lobo 🐺</p>
                <p className="text-xs text-muted-foreground mt-1">{analysis.tip}</p>
              </div>
            </div>
          </div>
        )}

        {/* Keywords */}
        {analysis.keywords && analysis.keywords.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Keywords de Busca</p>
            <div className="flex flex-wrap gap-1">
              {analysis.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        {analysis.priceRange && (
          <div className="pt-2 border-t border-accent/10">
            <p className="text-xs text-muted-foreground">Preço Brasil (estimado)</p>
            <p className="text-lg font-bold text-accent">{analysis.priceRange}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductAnalysisCard;
