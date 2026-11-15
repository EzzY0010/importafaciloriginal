import { assertEquals } from 'jsr:@std/assert@1';
import { formatChatReply, normalizeAnalysis, parseModelJson } from '../_shared/product-analysis.ts';

Deno.test('cap analysis keeps brand out of the customs description', () => {
  const a = normalizeAnalysis(parseModelJson('```json\n{"nome_produto":"Boné Gucci Monogram","marca":"Gucci","peso_estimado_gramas":250,"valor_medio_mercado_usd":380,"original_ou_replica":"Provavelmente réplica","atributos":{"category":"bone","material":"algodao","curvedBrim":true}}\n```'));
  assertEquals(a.nome_produto, 'Boné Gucci Monogram');
  assertEquals(a.marca, 'Gucci');
  assertEquals(a.peso_estimado_gramas, 250);
  assertEquals(a.valor_medio_mercado_usd, 380);
  assertEquals(a.descricao_alfandega, 'Boné de algodão com aba curva.');
});

Deno.test('sneakers become a neutral sports footwear description', () => {
  const a = normalizeAnalysis({ nome_produto: 'Tênis Mizuno Prophecy', marca: 'Mizuno', peso_estimado_gramas: 1200, atributos: { category: 'tenis', material: 'poliester' } });
  assertEquals(a.descricao_alfandega, 'Calçado esportivo de poliéster.');
  assertEquals(a.peso_estimado_gramas, 1200);
});

Deno.test('authenticity is never stated as certain', () => {
  assertEquals(normalizeAnalysis({ original_ou_replica: 'Original', atributos: { category: 'bone' } }).original_ou_replica, 'Provavelmente original');
  assertEquals(normalizeAnalysis({ original_ou_replica: 'não sei', atributos: { category: 'bone' } }).original_ou_replica, 'Não é possível confirmar pela imagem');
});

Deno.test('missing or absurd weight falls back to the category average', () => {
  assertEquals(normalizeAnalysis({ peso_estimado_gramas: 'x', atributos: { category: 'tenis' } }).peso_estimado_gramas, 1100);
  assertEquals(normalizeAnalysis({ peso_estimado_gramas: 999999, atributos: { category: 'bone' } }).peso_estimado_gramas, 180);
});

Deno.test('description never falls back to "produto importado"', () => {
  const a = normalizeAnalysis({ nome_produto: 'Chaveiro', atributos: { category: 'outro' } });
  assertEquals(a.descricao_alfandega.toLowerCase().includes('produto importado'), false);
});

Deno.test('brand never leaks into customs text even if the model puts it in material', () => {
  const a = normalizeAnalysis({ marca: 'Lacoste', atributos: { category: 'bone', material: 'Lacoste premium' } });
  assertEquals(a.descricao_alfandega, 'Boné.');
});

Deno.test('chat reply shows name, weight and price without asking for the product name', () => {
  const reply = formatChatReply(normalizeAnalysis({ nome_produto: 'Boné Lacoste Sport', peso_estimado_gramas: 150, valor_medio_mercado_usd: 55, atributos: { category: 'bone' } }));
  assertEquals(reply.includes('Boné Lacoste Sport'), true);
  assertEquals(reply.includes('~150 g'), true);
  assertEquals(reply.includes('US$ 55,00'), true);
  assertEquals(/envie (também )?o nome/i.test(reply), false);
});
