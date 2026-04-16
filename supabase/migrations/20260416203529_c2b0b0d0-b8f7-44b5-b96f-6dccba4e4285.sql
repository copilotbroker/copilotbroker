INSERT INTO public.projects (name, slug, city, city_slug, type, status, is_active, hero_title, hero_subtitle, description)
VALUES (
  'Aura Legano',
  'auralegano',
  'Nova Santa Rita',
  'novasantarita',
  'loteamento',
  'lancamento',
  true,
  'ÚLTIMOS 15 LOTES NO AURA LEGANO',
  'Condomínio de alto padrão em Nova Santa Rita. Entrega prevista para Julho/2026.',
  'Loteamento fechado de alto padrão em Nova Santa Rita com clube completo, parque linear e grandes áreas verdes. Restam apenas 15 lotes disponíveis.'
)
ON CONFLICT (slug) DO NOTHING;