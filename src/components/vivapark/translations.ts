export type Lang = "pt" | "en" | "es" | "fr";

export const translations: Record<Lang, {
  headline: string;
  subheadline: string;
  s1_title: string;
  s1_p1: string;
  s1_p2: string;
  s1_p3: string;
  s2_title: string;
  s2_items: string[];
  s2_footer: string;
  s3_title: string;
  s3_intro: string;
  s3_factors: string[];
  s3_location: string;
  s3_location_details: string[];
  s4_title: string;
  s4_intro: string;
  s4_categories: { title: string; items: string[] }[];
  s4_footer: string;
  s5_title: string;
  s5_lines: string[];
  s5_conclusion: string;
  s6_title: string;
  s6_lines: string[];
  s6_cta: string;
  s7_title: string;
  s7_option1: string;
  s7_option2: string;
  form_title: string;
  form_subtitle: string;
  form_name: string;
  form_phone: string;
  form_submit: string;
  form_terms_prefix: string;
  form_terms_link: string;
  form_success_title: string;
  form_success_msg: string;
  form_broker_toggle: string;
  form_broker_placeholder: string;
  footer_line1: string;
  footer_line2: string;
  footer_line3: string;
}> = {
  pt: {
    headline: "O dinheiro inteligente já escolheu onde estar.",
    subheadline: "Enquanto muitos ainda analisam, investidores nacionais e internacionais já estão posicionados dentro do Vivapark Porto Belo.",
    s1_title: "Abertura",
    s1_p1: "Existe uma diferença clara no mercado:\nQuem espera segurança… paga mais caro depois.\nQuem entende o movimento… entra antes.",
    s1_p2: "O Vivapark não é um projeto comum.\nÉ um dos empreendimentos urbanísticos mais completos já feitos no Brasil.",
    s1_p3: "E é exatamente por isso que ele está atraindo capital de fora.",
    s2_title: "Autoridade e Peso",
    s2_items: [
      "Primeiro bairro parque do Brasil",
      "Assinatura urbanística de Jaime Lerner",
      "Certificação internacional LEED Platinum",
      "Premiações globais de arquitetura e design",
    ],
    s2_footer: "Um projeto reconhecido não só pelo mercado brasileiro, mas validado internacionalmente.",
    s3_title: "Por que investidores estão entrando",
    s3_intro: "Investidores experientes não compram apenas imóveis.\nEles procuram projetos que concentram três fatores:",
    s3_factors: ["Crescimento da região", "Estrutura planejada", "Alta demanda futura"],
    s3_location: "Porto Belo — litoral de Santa Catarina",
    s3_location_details: ["A poucos minutos de Balneário Camboriú", "Região com expansão acelerada e valorização constante"],
    s4_title: "O que torna o Vivapark diferente",
    s4_intro: "Aqui não é só um lugar para morar.\nÉ um bairro inteiro planejado para funcionar sozinho.",
    s4_categories: [
      { title: "Educação", items: ["Colégio Bom Jesus (ensino infantil ao médio, com programa bilíngue)", "Projeto de instituição de ensino superior dentro do bairro"] },
      { title: "Saúde", items: ["Unidade de Pronto Atendimento (UPA)", "HUB de saúde com múltiplos serviços"] },
      { title: "Lazer e bem-estar", items: ["Mais de 138 mil m² de área verde", "Parques, praças e espaços de convivência", "Áreas esportivas e lazer completo"] },
      { title: "Infraestrutura", items: ["Cabeamento 100% subterrâneo", "Iluminação LED em todo o bairro", "Estações para carros elétricos", "Sistema de drenagem avançado e sustentável"] },
      { title: "Segurança", items: ["Monitoramento 24h com inteligência artificial", "Reconhecimento facial", "Leitura de placas de veículos", "Cercas virtuais (sem muros físicos)"] },
      { title: "Comércio e serviços", items: ["Mercado interno", "Espaços comerciais", "Restaurantes e conveniências"] },
    ],
    s4_footer: "Tudo integrado.",
    s5_title: "Lógica de Valorização",
    s5_lines: ["Quando tudo está dentro do mesmo lugar, acontece algo importante:", "As pessoas permanecem.", "O fluxo aumenta.", "A demanda cresce."],
    s5_conclusion: "E onde existe demanda constante… existe valorização.\nEsse é o tipo de ativo que investidores buscam.",
    s6_title: "Momento de Entrada",
    s6_lines: ["Projetos assim passam por fases:", "No início, poucos entendem.", "Depois, todos querem entrar.", "E por fim, os preços já não são mais os mesmos."],
    s6_cta: "Hoje, você ainda está no momento de escolha.",
    s7_title: "Decisão",
    s7_option1: "Esperar o mercado validar…",
    s7_option2: "ou se posicionar antes dele.",
    form_title: "Agora é simples.",
    form_subtitle: "Preencha seus dados e veja as oportunidades disponíveis dentro do Vivapark.",
    form_name: "Nome",
    form_phone: "Telefone (WhatsApp)",
    form_submit: "QUERO RECEBER AS OPORTUNIDADES",
    form_terms_prefix: "Aceito os",
    form_terms_link: "termos de uso e privacidade",
    form_success_title: "Cadastro realizado!",
    form_success_msg: "Em breve você receberá as oportunidades do Vivapark.",
    form_broker_toggle: "Já sou atendido por um corretor",
    form_broker_placeholder: "Selecione o corretor",
    footer_line1: "Os melhores investimentos não são os mais divulgados.",
    footer_line2: "São os que você entende antes dos outros.",
    footer_line3: "Vivapark não é sobre tendência. É sobre antecipação.",
  },
  en: {
    headline: "Smart money has already chosen where to be.",
    subheadline: "While many are still analyzing, national and international investors are already positioned inside Vivapark Porto Belo.",
    s1_title: "Opening",
    s1_p1: "There is a clear difference in the market:\nThose who wait for safety… pay more later.\nThose who understand the movement… get in first.",
    s1_p2: "Vivapark is not an ordinary project.\nIt is one of the most complete urban developments ever built in Brazil.",
    s1_p3: "And that is exactly why it is attracting foreign capital.",
    s2_title: "Authority & Weight",
    s2_items: [
      "Brazil's first park neighborhood",
      "Urban design by Jaime Lerner",
      "International LEED Platinum certification",
      "Global architecture and design awards",
    ],
    s2_footer: "A project recognized not only by the Brazilian market, but validated internationally.",
    s3_title: "Why investors are getting in",
    s3_intro: "Experienced investors don't just buy properties.\nThey look for projects that combine three factors:",
    s3_factors: ["Regional growth", "Planned infrastructure", "High future demand"],
    s3_location: "Porto Belo — coast of Santa Catarina, Brazil",
    s3_location_details: ["Minutes from Balneário Camboriú", "Region with accelerated expansion and constant appreciation"],
    s4_title: "What makes Vivapark different",
    s4_intro: "This is not just a place to live.\nIt's an entire neighborhood planned to be self-sufficient.",
    s4_categories: [
      { title: "Education", items: ["Bom Jesus School (K-12 with bilingual program)", "Higher education institution planned within the neighborhood"] },
      { title: "Healthcare", items: ["Emergency Care Unit (UPA)", "Health HUB with multiple services"] },
      { title: "Leisure & Wellness", items: ["Over 138,000 m² of green area", "Parks, plazas, and community spaces", "Sports areas and full recreation"] },
      { title: "Infrastructure", items: ["100% underground cabling", "LED lighting throughout", "Electric vehicle charging stations", "Advanced sustainable drainage system"] },
      { title: "Security", items: ["24/7 AI-powered monitoring", "Facial recognition", "License plate readers", "Virtual fences (no physical walls)"] },
      { title: "Commerce & Services", items: ["Internal market", "Commercial spaces", "Restaurants and conveniences"] },
    ],
    s4_footer: "All integrated.",
    s5_title: "Appreciation Logic",
    s5_lines: ["When everything is in the same place, something important happens:", "People stay.", "Traffic increases.", "Demand grows."],
    s5_conclusion: "And where there is constant demand… there is appreciation.\nThis is the type of asset investors seek.",
    s6_title: "Entry Timing",
    s6_lines: ["Projects like this go through phases:", "At the beginning, few understand.", "Then, everyone wants in.", "And finally, prices are no longer the same."],
    s6_cta: "Today, you are still at the moment of choice.",
    s7_title: "Decision",
    s7_option1: "Wait for the market to validate…",
    s7_option2: "or position yourself ahead of it.",
    form_title: "It's simple now.",
    form_subtitle: "Fill in your details and see the opportunities available inside Vivapark.",
    form_name: "Name",
    form_phone: "Phone (WhatsApp)",
    form_submit: "I WANT TO RECEIVE OPPORTUNITIES",
    form_terms_prefix: "I accept the",
    form_terms_link: "terms and privacy policy",
    form_success_title: "Registration complete!",
    form_success_msg: "You will soon receive Vivapark opportunities.",
    form_broker_toggle: "I already have a broker",
    form_broker_placeholder: "Select your broker",
    footer_line1: "The best investments are not the most advertised.",
    footer_line2: "They are the ones you understand before others.",
    footer_line3: "Vivapark is not about trends. It's about anticipation.",
  },
  es: {
    headline: "El dinero inteligente ya eligió dónde estar.",
    subheadline: "Mientras muchos aún analizan, inversores nacionales e internacionales ya están posicionados dentro de Vivapark Porto Belo.",
    s1_title: "Apertura",
    s1_p1: "Hay una diferencia clara en el mercado:\nQuien espera seguridad… paga más caro después.\nQuien entiende el movimiento… entra antes.",
    s1_p2: "Vivapark no es un proyecto común.\nEs uno de los emprendimientos urbanísticos más completos jamás construidos en Brasil.",
    s1_p3: "Y es exactamente por eso que está atrayendo capital extranjero.",
    s2_title: "Autoridad y Peso",
    s2_items: [
      "Primer barrio parque de Brasil",
      "Diseño urbanístico de Jaime Lerner",
      "Certificación internacional LEED Platinum",
      "Premios globales de arquitectura y diseño",
    ],
    s2_footer: "Un proyecto reconocido no solo por el mercado brasileño, sino validado internacionalmente.",
    s3_title: "Por qué los inversores están entrando",
    s3_intro: "Los inversores experimentados no compran solo propiedades.\nBuscan proyectos que concentran tres factores:",
    s3_factors: ["Crecimiento de la región", "Estructura planificada", "Alta demanda futura"],
    s3_location: "Porto Belo — litoral de Santa Catarina, Brasil",
    s3_location_details: ["A pocos minutos de Balneário Camboriú", "Región con expansión acelerada y valorización constante"],
    s4_title: "Qué hace al Vivapark diferente",
    s4_intro: "Aquí no es solo un lugar para vivir.\nEs un barrio entero planificado para funcionar por sí solo.",
    s4_categories: [
      { title: "Educación", items: ["Colegio Bom Jesus (infantil a secundaria, con programa bilingüe)", "Proyecto de institución de educación superior dentro del barrio"] },
      { title: "Salud", items: ["Unidad de Atención de Emergencia (UPA)", "HUB de salud con múltiples servicios"] },
      { title: "Ocio y bienestar", items: ["Más de 138 mil m² de área verde", "Parques, plazas y espacios de convivencia", "Áreas deportivas y recreación completa"] },
      { title: "Infraestructura", items: ["Cableado 100% subterráneo", "Iluminación LED en todo el barrio", "Estaciones para autos eléctricos", "Sistema de drenaje avanzado y sostenible"] },
      { title: "Seguridad", items: ["Monitoreo 24h con inteligencia artificial", "Reconocimiento facial", "Lectura de placas vehiculares", "Cercas virtuales (sin muros físicos)"] },
      { title: "Comercio y servicios", items: ["Mercado interno", "Espacios comerciales", "Restaurantes y conveniencias"] },
    ],
    s4_footer: "Todo integrado.",
    s5_title: "Lógica de Valorización",
    s5_lines: ["Cuando todo está en el mismo lugar, algo importante sucede:", "Las personas permanecen.", "El flujo aumenta.", "La demanda crece."],
    s5_conclusion: "Y donde existe demanda constante… existe valorización.\nEste es el tipo de activo que buscan los inversores.",
    s6_title: "Momento de Entrada",
    s6_lines: ["Proyectos así pasan por fases:", "Al inicio, pocos entienden.", "Después, todos quieren entrar.", "Y al final, los precios ya no son los mismos."],
    s6_cta: "Hoy, todavía estás en el momento de elección.",
    s7_title: "Decisión",
    s7_option1: "Esperar que el mercado valide…",
    s7_option2: "o posicionarse antes que él.",
    form_title: "Ahora es simple.",
    form_subtitle: "Completa tus datos y ve las oportunidades disponibles dentro del Vivapark.",
    form_name: "Nombre",
    form_phone: "Teléfono (WhatsApp)",
    form_submit: "QUIERO RECIBIR LAS OPORTUNIDADES",
    form_terms_prefix: "Acepto los",
    form_terms_link: "términos de uso y privacidad",
    form_success_title: "¡Registro completado!",
    form_success_msg: "Pronto recibirás las oportunidades del Vivapark.",
    form_broker_toggle: "Ya soy atendido por un corredor",
    form_broker_placeholder: "Selecciona el corredor",
    footer_line1: "Las mejores inversiones no son las más divulgadas.",
    footer_line2: "Son las que entiendes antes que los demás.",
    footer_line3: "Vivapark no es sobre tendencia. Es sobre anticipación.",
  },
  fr: {
    headline: "L'argent intelligent a déjà choisi où être.",
    subheadline: "Tandis que beaucoup analysent encore, des investisseurs nationaux et internationaux sont déjà positionnés au sein du Vivapark Porto Belo.",
    s1_title: "Ouverture",
    s1_p1: "Il y a une différence claire sur le marché :\nCeux qui attendent la sécurité… paient plus cher après.\nCeux qui comprennent le mouvement… entrent avant.",
    s1_p2: "Le Vivapark n'est pas un projet ordinaire.\nC'est l'un des développements urbains les plus complets jamais réalisés au Brésil.",
    s1_p3: "Et c'est exactement pourquoi il attire des capitaux étrangers.",
    s2_title: "Autorité et Poids",
    s2_items: [
      "Premier quartier-parc du Brésil",
      "Conception urbanistique de Jaime Lerner",
      "Certification internationale LEED Platinum",
      "Prix mondiaux d'architecture et de design",
    ],
    s2_footer: "Un projet reconnu non seulement par le marché brésilien, mais validé internationalement.",
    s3_title: "Pourquoi les investisseurs entrent",
    s3_intro: "Les investisseurs expérimentés n'achètent pas seulement des propriétés.\nIls recherchent des projets qui combinent trois facteurs :",
    s3_factors: ["Croissance de la région", "Infrastructure planifiée", "Forte demande future"],
    s3_location: "Porto Belo — côte de Santa Catarina, Brésil",
    s3_location_details: ["À quelques minutes de Balneário Camboriú", "Région en expansion accélérée et valorisation constante"],
    s4_title: "Ce qui rend le Vivapark différent",
    s4_intro: "Ce n'est pas seulement un lieu de vie.\nC'est un quartier entier conçu pour fonctionner de manière autonome.",
    s4_categories: [
      { title: "Éducation", items: ["Collège Bom Jesus (maternelle au lycée, programme bilingue)", "Projet d'établissement d'enseignement supérieur dans le quartier"] },
      { title: "Santé", items: ["Unité d'urgence (UPA)", "HUB de santé avec services multiples"] },
      { title: "Loisirs et bien-être", items: ["Plus de 138 000 m² d'espaces verts", "Parcs, places et espaces de convivialité", "Zones sportives et loisirs complets"] },
      { title: "Infrastructure", items: ["Câblage 100% souterrain", "Éclairage LED dans tout le quartier", "Bornes de recharge pour véhicules électriques", "Système de drainage avancé et durable"] },
      { title: "Sécurité", items: ["Surveillance 24h avec intelligence artificielle", "Reconnaissance faciale", "Lecture des plaques d'immatriculation", "Clôtures virtuelles (sans murs physiques)"] },
      { title: "Commerce et services", items: ["Marché interne", "Espaces commerciaux", "Restaurants et commodités"] },
    ],
    s4_footer: "Tout intégré.",
    s5_title: "Logique de Valorisation",
    s5_lines: ["Quand tout est au même endroit, quelque chose d'important se produit :", "Les gens restent.", "Le flux augmente.", "La demande croît."],
    s5_conclusion: "Et là où il y a une demande constante… il y a valorisation.\nC'est le type d'actif que recherchent les investisseurs.",
    s6_title: "Moment d'Entrée",
    s6_lines: ["Des projets comme celui-ci passent par des phases :", "Au début, peu comprennent.", "Ensuite, tout le monde veut entrer.", "Et finalement, les prix ne sont plus les mêmes."],
    s6_cta: "Aujourd'hui, vous êtes encore au moment du choix.",
    s7_title: "Décision",
    s7_option1: "Attendre que le marché valide…",
    s7_option2: "ou se positionner avant lui.",
    form_title: "C'est simple maintenant.",
    form_subtitle: "Remplissez vos coordonnées et découvrez les opportunités disponibles au sein du Vivapark.",
    form_name: "Nom",
    form_phone: "Téléphone (WhatsApp)",
    form_submit: "JE VEUX RECEVOIR LES OPPORTUNITÉS",
    form_terms_prefix: "J'accepte les",
    form_terms_link: "conditions d'utilisation et de confidentialité",
    form_success_title: "Inscription réalisée !",
    form_success_msg: "Vous recevrez bientôt les opportunités du Vivapark.",
    form_broker_toggle: "J'ai déjà un courtier",
    form_broker_placeholder: "Sélectionnez le courtier",
    footer_line1: "Les meilleurs investissements ne sont pas les plus médiatisés.",
    footer_line2: "Ce sont ceux que vous comprenez avant les autres.",
    footer_line3: "Vivapark n'est pas une tendance. C'est de l'anticipation.",
  },
};

export const flags: Record<Lang, { emoji: string; label: string }> = {
  pt: { emoji: "🇧🇷", label: "Português" },
  en: { emoji: "🇺🇸", label: "English" },
  es: { emoji: "🇪🇸", label: "Español" },
  fr: { emoji: "🇫🇷", label: "France" },
};
