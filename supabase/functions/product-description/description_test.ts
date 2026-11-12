import { buildCustomsDescription } from '../_shared/customs-description.ts';
function equal(actual: unknown, expected: unknown) { if (actual !== expected) throw new Error(`Expected ${expected}, received ${actual}`); }
Deno.test('customs description excludes brand commercial name logo model and authenticity', () => {
  const description = buildCustomsDescription({ category: 'camiseta', sleeves: 'curta', print: true, brand: 'Nike', commercialName: 'Air Jordan', logo: 'Swoosh', model: 'ABC123', authenticity: 'original' });
  equal(description, 'Camiseta com manga curta, estampa frontal.');
  if (/Nike|Jordan|Swoosh|ABC123|original/i.test(description)) throw new Error('Restricted attribute leaked');
});
Deno.test('customs description never invents composition origin or declaration value', () => {
  equal(buildCustomsDescription({ category: 'calcado', material: 'borracha', composition: 'algodão', origin: 'China', declaration: 2 }), 'Calçado.');
});
Deno.test('unidentified product asks for another photo', () => {
  equal(buildCustomsDescription({ category: 'outro' }), 'Produto não identificável pela imagem. Envie uma foto adicional mais nítida.');
});