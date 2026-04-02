import type { Lang } from "./translations";

export const investorTranslations: Record<Lang, {
  badge_first_park: string;
  stats_title: string;
  stats: { value: string; label: string }[];
  sc_title: string;
  sc_subtitle: string;
  sc_ranking: { city: string; price: string; growth: string }[];
  sc_source: string;
  porto_title: string;
  porto_subtitle: string;
  porto_reasons: string[];
  porto_indicators_title: string;
  porto_indicators: string[];
  market_title: string;
  market_p1: string;
  market_p2: string;
  market_invest_title: string;
  market_invest_items: string[];
  location_distances: { place: string; time: string }[];
}> = {
  pt: {
    badge_first_park: "1º Bairro Parque do Brasil",
    stats_title: "Em números",
    stats: [
      { value: "+180%", label: "Valorização desde o lançamento em 2021" },
      { value: "138 mil", label: "m² de área verde" },
      { value: "1º", label: "LEED Platinum do mundo na categoria" },
      { value: "40+", label: "Países competiram no ACD Awards" },
    ],
    sc_title: "Santa Catarina: a maior valorização imobiliária do Brasil",
    sc_subtitle: "O estado possui o metro quadrado mais caro do país. As cidades catarinenses valorizaram em média 19%, contra 6,16% da média nacional.",
    sc_ranking: [
      { city: "Balneário Camboriú (SC)", price: "R$ 12.073/m²", growth: "+21,42%" },
      { city: "Itapema (SC)", price: "R$ 11.219/m²", growth: "+18,34%" },
      { city: "São Paulo (SP)", price: "R$ 10.350/m²", growth: "+4,72%" },
    ],
    sc_source: "Fonte: FipeZap+",
    porto_title: "Por que investir em Porto Belo?",
    porto_subtitle: "Porto Belo se destaca por suas belezas naturais e qualidade de vida, atraindo fortes investimentos imobiliários.",
    porto_reasons: [
      "Localização estratégica com crescimento urbano constante",
      "Belezas naturais preservadas na Costa Esmeralda",
      "Um dos maiores índices de qualidade de vida do Brasil",
      "Forte polo turístico com turismo náutico em expansão",
      "A 20 min de Balneário Camboriú e 45 min de Florianópolis",
      "Diversos projetos futuros de revitalização e infraestrutura",
    ],
    porto_indicators_title: "Indicadores de valorização",
    porto_indicators: [
      "Grande demanda reprimida de espaços semelhantes",
      "Crescimento exponencial da região",
      "Vale do Itajaí + norte catarinense = 60% do PIB de SC",
      "Vivapark gera ~2 mil empregos diretos e 30% de crescimento para a cidade",
      "Serão mais 25 anos de obras pela frente, até 2050 e + de 150 lançamentos",
    ],
    market_title: "Mercado Imobiliário de Alto Padrão",
    market_p1: "Mercados de alto padrão tendem a ter desempenho positivo com a Selic alta, pois a inflação eleva o CUB (Custo Unitário Básico de Construção), aumentando o valor do m² dos novos empreendimentos.",
    market_p2: "Faltam ativos de qualidade para investimento na região. Projetos com alto valor agregado se tornam atraentes para quem enxerga o potencial de valorização em longo prazo.",
    market_invest_title: "Por que investir em imóveis?",
    market_invest_items: [
      "Segurança e solidez patrimonial",
      "Rentabilidade e valorização garantida",
      "Proteção contra a inflação",
      "Potencial fonte de renda passiva",
      "Baixa volatilidade comparado à bolsa de valores",
    ],
    location_distances: [
      { place: "Balneário Camboriú", time: "20 min" },
      { place: "Itapema", time: "5 min" },
      { place: "Florianópolis", time: "1h" },
      { place: "Aeroporto de Navegantes", time: "55 min" },
      { place: "Cond. Aeronáutico Costa Esmeralda", time: "10 min" },
    ],
  },
  en: {
    badge_first_park: "Brazil's 1st Park Neighborhood",
    stats_title: "By the numbers",
    stats: [
      { value: "+180%", label: "Appreciation since launch in 2021" },
      { value: "138k", label: "m² of green area" },
      { value: "1st", label: "LEED Platinum worldwide in category" },
      { value: "40+", label: "Countries competed at ACD Awards" },
    ],
    sc_title: "Santa Catarina: Brazil's highest real estate appreciation",
    sc_subtitle: "The state has the most expensive square meter in the country. Santa Catarina cities appreciated 19% on average, vs. 6.16% nationally.",
    sc_ranking: [
      { city: "Balneário Camboriú (SC)", price: "R$ 12,073/m²", growth: "+21.42%" },
      { city: "Itapema (SC)", price: "R$ 11,219/m²", growth: "+18.34%" },
      { city: "São Paulo (SP)", price: "R$ 10,350/m²", growth: "+4.72%" },
    ],
    sc_source: "Source: FipeZap+",
    porto_title: "Why invest in Porto Belo?",
    porto_subtitle: "Porto Belo stands out for its natural beauty and quality of life, attracting strong real estate investments.",
    porto_reasons: [
      "Strategic location with constant urban growth",
      "Preserved natural beauty on the Emerald Coast",
      "One of Brazil's highest quality of life indexes",
      "Strong tourism hub with expanding nautical tourism",
      "20 min from Balneário Camboriú, 45 min from Florianópolis",
      "Multiple future revitalization and infrastructure projects",
    ],
    porto_indicators_title: "Appreciation indicators",
    porto_indicators: [
      "Large pent-up demand for similar spaces",
      "Exponential regional growth",
      "Itajaí Valley + northern SC = 60% of state GDP",
      "Vivapark generates ~2,000 direct jobs and 30% city growth",
      "25+ more years of development ahead, until 2050 with 150+ launches",
    ],
    market_title: "High-End Real Estate Market",
    market_p1: "High-end markets tend to perform positively with high interest rates, as inflation raises construction costs, increasing the value per m² of new developments.",
    market_p2: "There is a shortage of quality investment assets in the region. Projects with high added value become attractive for those who see long-term appreciation potential.",
    market_invest_title: "Why invest in real estate?",
    market_invest_items: [
      "Asset security and solidity",
      "Guaranteed appreciation and returns",
      "Inflation protection",
      "Passive income potential",
      "Low volatility compared to stock markets",
    ],
    location_distances: [
      { place: "Balneário Camboriú", time: "20 min" },
      { place: "Itapema", time: "5 min" },
      { place: "Florianópolis", time: "1h" },
      { place: "Navegantes Airport", time: "55 min" },
      { place: "Costa Esmeralda Airfield", time: "10 min" },
    ],
  },
  es: {
    badge_first_park: "1er Barrio Parque de Brasil",
    stats_title: "En números",
    stats: [
      { value: "+180%", label: "Valorización desde el lanzamiento en 2021" },
      { value: "138 mil", label: "m² de área verde" },
      { value: "1º", label: "LEED Platinum mundial en categoría" },
      { value: "40+", label: "Países compitieron en ACD Awards" },
    ],
    sc_title: "Santa Catarina: la mayor valorización inmobiliaria de Brasil",
    sc_subtitle: "El estado tiene el metro cuadrado más caro del país. Las ciudades catarinenses valorizaron en promedio 19%, contra 6,16% del promedio nacional.",
    sc_ranking: [
      { city: "Balneário Camboriú (SC)", price: "R$ 12.073/m²", growth: "+21,42%" },
      { city: "Itapema (SC)", price: "R$ 11.219/m²", growth: "+18,34%" },
      { city: "São Paulo (SP)", price: "R$ 10.350/m²", growth: "+4,72%" },
    ],
    sc_source: "Fuente: FipeZap+",
    porto_title: "¿Por qué invertir en Porto Belo?",
    porto_subtitle: "Porto Belo se destaca por sus bellezas naturales y calidad de vida, atrayendo fuertes inversiones inmobiliarias.",
    porto_reasons: [
      "Ubicación estratégica con crecimiento urbano constante",
      "Bellezas naturales preservadas en la Costa Esmeralda",
      "Uno de los mayores índices de calidad de vida de Brasil",
      "Fuerte polo turístico con turismo náutico en expansión",
      "A 20 min de Balneário Camboriú y 45 min de Florianópolis",
      "Diversos proyectos futuros de revitalización e infraestructura",
    ],
    porto_indicators_title: "Indicadores de valorización",
    porto_indicators: [
      "Gran demanda reprimida de espacios similares",
      "Crecimiento exponencial de la región",
      "Valle de Itajaí + norte catarinense = 60% del PIB de SC",
      "Vivapark genera ~2 mil empleos directos y 30% de crecimiento para la ciudad",
      "Serán más de 25 años de obras por delante, hasta 2050 y + de 150 lanzamientos",
    ],
    market_title: "Mercado Inmobiliario de Alto Estándar",
    market_p1: "Los mercados de alto estándar tienden a tener desempeño positivo con tasas altas, pues la inflación eleva el costo de construcción, aumentando el valor del m² de los nuevos emprendimientos.",
    market_p2: "Faltan activos de calidad para inversión en la región. Proyectos con alto valor agregado se vuelven atractivos para quienes ven el potencial de valorización a largo plazo.",
    market_invest_title: "¿Por qué invertir en inmuebles?",
    market_invest_items: [
      "Seguridad y solidez patrimonial",
      "Rentabilidad y valorización garantizada",
      "Protección contra la inflación",
      "Potencial fuente de renta pasiva",
      "Baja volatilidad comparado a la bolsa de valores",
    ],
    location_distances: [
      { place: "Balneário Camboriú", time: "20 min" },
      { place: "Itapema", time: "5 min" },
      { place: "Florianópolis", time: "1h" },
      { place: "Aeropuerto de Navegantes", time: "55 min" },
      { place: "Cond. Aeronáutico Costa Esmeralda", time: "10 min" },
    ],
  },
  fr: {
    badge_first_park: "1er Quartier-Parc du Brésil",
    stats_title: "En chiffres",
    stats: [
      { value: "+180%", label: "Valorisation depuis le lancement en 2021" },
      { value: "138k", label: "m² d'espaces verts" },
      { value: "1er", label: "LEED Platinum mondial dans sa catégorie" },
      { value: "40+", label: "Pays en compétition aux ACD Awards" },
    ],
    sc_title: "Santa Catarina : la plus forte valorisation immobilière du Brésil",
    sc_subtitle: "L'État possède le mètre carré le plus cher du pays. Les villes de Santa Catarina ont valorisé de 19% en moyenne, contre 6,16% au niveau national.",
    sc_ranking: [
      { city: "Balneário Camboriú (SC)", price: "R$ 12 073/m²", growth: "+21,42%" },
      { city: "Itapema (SC)", price: "R$ 11 219/m²", growth: "+18,34%" },
      { city: "São Paulo (SP)", price: "R$ 10 350/m²", growth: "+4,72%" },
    ],
    sc_source: "Source : FipeZap+",
    porto_title: "Pourquoi investir à Porto Belo ?",
    porto_subtitle: "Porto Belo se distingue par ses beautés naturelles et sa qualité de vie, attirant de solides investissements immobiliers.",
    porto_reasons: [
      "Emplacement stratégique avec croissance urbaine constante",
      "Beautés naturelles préservées sur la Côte d'Émeraude",
      "L'un des meilleurs indices de qualité de vie du Brésil",
      "Pôle touristique fort avec tourisme nautique en expansion",
      "À 20 min de Balneário Camboriú et 45 min de Florianópolis",
      "Nombreux projets de revitalisation et d'infrastructure à venir",
    ],
    porto_indicators_title: "Indicateurs de valorisation",
    porto_indicators: [
      "Forte demande refoulée pour des espaces similaires",
      "Croissance exponentielle de la région",
      "Vallée d'Itajaí + nord de SC = 60% du PIB de l'État",
      "Vivapark génère ~2 000 emplois directs et 30% de croissance pour la ville",
      "Plus de 25 ans de travaux à venir, jusqu'en 2050 et + de 150 lancements",
    ],
    market_title: "Marché immobilier haut de gamme",
    market_p1: "Les marchés haut de gamme tendent à bien performer avec des taux élevés, car l'inflation augmente les coûts de construction, élevant la valeur du m² des nouveaux projets.",
    market_p2: "Il y a un manque d'actifs de qualité pour l'investissement dans la région. Les projets à forte valeur ajoutée deviennent attractifs pour ceux qui voient le potentiel de valorisation à long terme.",
    market_invest_title: "Pourquoi investir dans l'immobilier ?",
    market_invest_items: [
      "Sécurité et solidité patrimoniale",
      "Rentabilité et valorisation garantie",
      "Protection contre l'inflation",
      "Potentiel de revenus passifs",
      "Faible volatilité comparé aux marchés boursiers",
    ],
    location_distances: [
      { place: "Balneário Camboriú", time: "20 min" },
      { place: "Itapema", time: "5 min" },
      { place: "Florianópolis", time: "1h" },
      { place: "Aéroport de Navegantes", time: "55 min" },
      { place: "Cond. Aéronautique Costa Esmeralda", time: "10 min" },
    ],
  },
};
