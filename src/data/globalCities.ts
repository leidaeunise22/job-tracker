export type CostTier = 'Budget' | 'Moderate' | 'Expensive' | 'Very Expensive'
export type Region = 'Americas' | 'Europe' | 'Asia' | 'Oceania' | 'Africa & Middle East'

export interface GlobalCity {
  id: string           // matches SEED_CITIES id when applicable, else 'gf-...'
  name: string
  country: string
  region: Region
  tagline: string
  costTier: CostTier
  seedCityId?: string  // set when this city exists in SEED_CITIES
  scores: {
    walkability: number
    nature: number
    nightlife: number
    arts: number
    affordability: number
    techJobs: number
    transit: number
    beach: number
    mountains: number
    food: number
    diversity: number
    safety: number
    warmWeather: number
    fourSeasons: number
    familyFriendly: number
  }
}

export const GLOBAL_CITIES: GlobalCity[] = [
  // ── Americas ──────────────────────────────────────────────────
  {
    id: 'austin-tx', seedCityId: 'austin-tx',
    name: 'Austin', country: 'USA', region: 'Americas', costTier: 'Expensive',
    tagline: 'Live music, tech unicorns, and year-round sunshine.',
    scores: { walkability: 4, nature: 5, nightlife: 9, arts: 7, affordability: 4,
      techJobs: 10, transit: 3, beach: 1, mountains: 1, food: 8, diversity: 6,
      safety: 7, warmWeather: 8, fourSeasons: 4, familyFriendly: 7 },
  },
  {
    id: 'seattle-wa', seedCityId: 'seattle-wa',
    name: 'Seattle', country: 'USA', region: 'Americas', costTier: 'Very Expensive',
    tagline: 'Big tech, mountains, and the best coffee culture on earth.',
    scores: { walkability: 7, nature: 9, nightlife: 7, arts: 7, affordability: 2,
      techJobs: 10, transit: 7, beach: 3, mountains: 9, food: 8, diversity: 8,
      safety: 6, warmWeather: 4, fourSeasons: 7, familyFriendly: 7 },
  },
  {
    id: 'denver-co', seedCityId: 'denver-co',
    name: 'Denver', country: 'USA', region: 'Americas', costTier: 'Expensive',
    tagline: 'Mile High city with world-class trails outside your door.',
    scores: { walkability: 6, nature: 10, nightlife: 7, arts: 6, affordability: 3,
      techJobs: 7, transit: 5, beach: 1, mountains: 10, food: 7, diversity: 6,
      safety: 7, warmWeather: 6, fourSeasons: 9, familyFriendly: 8 },
  },
  {
    id: 'gf-new-york-usa',
    name: 'New York City', country: 'USA', region: 'Americas', costTier: 'Very Expensive',
    tagline: 'The city that never sleeps — culture, finance, and endless energy.',
    scores: { walkability: 10, nature: 3, nightlife: 10, arts: 10, affordability: 1,
      techJobs: 9, transit: 10, beach: 2, mountains: 1, food: 10, diversity: 10,
      safety: 7, warmWeather: 5, fourSeasons: 9, familyFriendly: 5 },
  },
  {
    id: 'gf-miami-usa',
    name: 'Miami', country: 'USA', region: 'Americas', costTier: 'Expensive',
    tagline: 'Beaches, Latin flair, and a booming tech & finance scene.',
    scores: { walkability: 5, nature: 5, nightlife: 10, arts: 7, affordability: 3,
      techJobs: 5, transit: 4, beach: 10, mountains: 1, food: 9, diversity: 9,
      safety: 6, warmWeather: 10, fourSeasons: 2, familyFriendly: 6 },
  },
  {
    id: 'gf-chicago-usa',
    name: 'Chicago', country: 'USA', region: 'Americas', costTier: 'Moderate',
    tagline: 'World-class architecture, deep-dish, and a true four-season city.',
    scores: { walkability: 8, nature: 4, nightlife: 9, arts: 9, affordability: 5,
      techJobs: 7, transit: 8, beach: 3, mountains: 1, food: 9, diversity: 8,
      safety: 5, warmWeather: 3, fourSeasons: 10, familyFriendly: 6 },
  },
  {
    id: 'gf-portland-usa',
    name: 'Portland', country: 'USA', region: 'Americas', costTier: 'Moderate',
    tagline: 'Keep it weird: great food, bike-friendly, and stunning nature nearby.',
    scores: { walkability: 8, nature: 8, nightlife: 7, arts: 8, affordability: 5,
      techJobs: 6, transit: 7, beach: 3, mountains: 7, food: 9, diversity: 6,
      safety: 5, warmWeather: 5, fourSeasons: 8, familyFriendly: 7 },
  },
  {
    id: 'gf-toronto-ca',
    name: 'Toronto', country: 'Canada', region: 'Americas', costTier: 'Expensive',
    tagline: 'One of the most multicultural cities on earth, with a surging tech sector.',
    scores: { walkability: 8, nature: 5, nightlife: 7, arts: 8, affordability: 3,
      techJobs: 8, transit: 8, beach: 2, mountains: 2, food: 9, diversity: 10,
      safety: 8, warmWeather: 3, fourSeasons: 9, familyFriendly: 8 },
  },
  {
    id: 'gf-vancouver-ca',
    name: 'Vancouver', country: 'Canada', region: 'Americas', costTier: 'Very Expensive',
    tagline: 'Mountains, ocean, and one of the most livable cities in the world.',
    scores: { walkability: 8, nature: 9, nightlife: 6, arts: 7, affordability: 2,
      techJobs: 7, transit: 8, beach: 5, mountains: 10, food: 8, diversity: 9,
      safety: 8, warmWeather: 5, fourSeasons: 7, familyFriendly: 8 },
  },
  {
    id: 'gf-medellin-co',
    name: 'Medellín', country: 'Colombia', region: 'Americas', costTier: 'Budget',
    tagline: 'Eternal spring weather, a rising startup scene, and incredible energy.',
    scores: { walkability: 7, nature: 7, nightlife: 9, arts: 7, affordability: 9,
      techJobs: 5, transit: 6, beach: 1, mountains: 7, food: 7, diversity: 6,
      safety: 6, warmWeather: 9, fourSeasons: 2, familyFriendly: 6 },
  },
  {
    id: 'gf-mexico-city-mx',
    name: 'Mexico City', country: 'Mexico', region: 'Americas', costTier: 'Budget',
    tagline: 'World-class museums, food, and architecture at a fraction of US prices.',
    scores: { walkability: 7, nature: 5, nightlife: 9, arts: 10, affordability: 8,
      techJobs: 5, transit: 7, beach: 1, mountains: 6, food: 10, diversity: 7,
      safety: 5, warmWeather: 8, fourSeasons: 5, familyFriendly: 6 },
  },

  // ── Europe ────────────────────────────────────────────────────
  {
    id: 'gf-lisbon-pt',
    name: 'Lisbon', country: 'Portugal', region: 'Europe', costTier: 'Moderate',
    tagline: 'Sun, trams, and the most affordable capital in Western Europe.',
    scores: { walkability: 8, nature: 6, nightlife: 9, arts: 8, affordability: 7,
      techJobs: 5, transit: 7, beach: 8, mountains: 4, food: 9, diversity: 7,
      safety: 9, warmWeather: 9, fourSeasons: 6, familyFriendly: 7 },
  },
  {
    id: 'gf-barcelona-es',
    name: 'Barcelona', country: 'Spain', region: 'Europe', costTier: 'Moderate',
    tagline: 'Gaudí, beaches, tapas, and one of Europe\'s best startup ecosystems.',
    scores: { walkability: 9, nature: 6, nightlife: 10, arts: 9, affordability: 5,
      techJobs: 6, transit: 8, beach: 9, mountains: 6, food: 10, diversity: 8,
      safety: 7, warmWeather: 9, fourSeasons: 5, familyFriendly: 7 },
  },
  {
    id: 'gf-amsterdam-nl',
    name: 'Amsterdam', country: 'Netherlands', region: 'Europe', costTier: 'Expensive',
    tagline: 'Bikes, canals, and a uniquely international culture in the heart of Europe.',
    scores: { walkability: 9, nature: 5, nightlife: 9, arts: 9, affordability: 3,
      techJobs: 7, transit: 9, beach: 4, mountains: 1, food: 7, diversity: 8,
      safety: 8, warmWeather: 4, fourSeasons: 8, familyFriendly: 8 },
  },
  {
    id: 'gf-berlin-de',
    name: 'Berlin', country: 'Germany', region: 'Europe', costTier: 'Moderate',
    tagline: 'Europe\'s startup capital with legendary nightlife and rich history.',
    scores: { walkability: 8, nature: 5, nightlife: 10, arts: 9, affordability: 5,
      techJobs: 7, transit: 9, beach: 3, mountains: 2, food: 8, diversity: 9,
      safety: 7, warmWeather: 4, fourSeasons: 8, familyFriendly: 7 },
  },
  {
    id: 'gf-vienna-at',
    name: 'Vienna', country: 'Austria', region: 'Europe', costTier: 'Moderate',
    tagline: 'Ranked the world\'s most livable city for its culture, safety, and transit.',
    scores: { walkability: 9, nature: 6, nightlife: 7, arts: 10, affordability: 5,
      techJobs: 5, transit: 10, beach: 1, mountains: 7, food: 8, diversity: 7,
      safety: 9, warmWeather: 5, fourSeasons: 9, familyFriendly: 9 },
  },
  {
    id: 'gf-prague-cz',
    name: 'Prague', country: 'Czech Republic', region: 'Europe', costTier: 'Moderate',
    tagline: 'A fairy-tale medieval city with low costs and a growing digital hub.',
    scores: { walkability: 9, nature: 5, nightlife: 9, arts: 9, affordability: 7,
      techJobs: 4, transit: 8, beach: 1, mountains: 3, food: 7, diversity: 6,
      safety: 8, warmWeather: 5, fourSeasons: 8, familyFriendly: 8 },
  },
  {
    id: 'gf-copenhagen-dk',
    name: 'Copenhagen', country: 'Denmark', region: 'Europe', costTier: 'Very Expensive',
    tagline: 'Happiest country, best work-life balance, world-class design and cycling.',
    scores: { walkability: 9, nature: 6, nightlife: 6, arts: 8, affordability: 2,
      techJobs: 6, transit: 9, beach: 3, mountains: 1, food: 8, diversity: 7,
      safety: 10, warmWeather: 3, fourSeasons: 8, familyFriendly: 10 },
  },
  {
    id: 'gf-london-uk',
    name: 'London', country: 'United Kingdom', region: 'Europe', costTier: 'Very Expensive',
    tagline: 'Finance, fintech, and culture at the crossroads of the world.',
    scores: { walkability: 8, nature: 5, nightlife: 9, arts: 10, affordability: 2,
      techJobs: 8, transit: 10, beach: 2, mountains: 1, food: 9, diversity: 10,
      safety: 7, warmWeather: 4, fourSeasons: 9, familyFriendly: 7 },
  },
  {
    id: 'gf-budapest-hu',
    name: 'Budapest', country: 'Hungary', region: 'Europe', costTier: 'Budget',
    tagline: 'Stunning architecture, thermal baths, and Central Europe\'s best nightlife.',
    scores: { walkability: 8, nature: 5, nightlife: 9, arts: 8, affordability: 8,
      techJobs: 4, transit: 8, beach: 1, mountains: 3, food: 7, diversity: 6,
      safety: 7, warmWeather: 5, fourSeasons: 8, familyFriendly: 7 },
  },
  {
    id: 'gf-tallinn-ee',
    name: 'Tallinn', country: 'Estonia', region: 'Europe', costTier: 'Moderate',
    tagline: 'Medieval old town meets Europe\'s most digitally advanced society.',
    scores: { walkability: 7, nature: 6, nightlife: 6, arts: 7, affordability: 7,
      techJobs: 7, transit: 6, beach: 3, mountains: 1, food: 6, diversity: 5,
      safety: 9, warmWeather: 3, fourSeasons: 8, familyFriendly: 7 },
  },

  // ── Asia ──────────────────────────────────────────────────────
  {
    id: 'gf-tokyo-jp',
    name: 'Tokyo', country: 'Japan', region: 'Asia', costTier: 'Expensive',
    tagline: 'The safest megacity on earth, with unmatched food and transit.',
    scores: { walkability: 9, nature: 5, nightlife: 8, arts: 9, affordability: 3,
      techJobs: 7, transit: 10, beach: 4, mountains: 5, food: 10, diversity: 5,
      safety: 10, warmWeather: 6, fourSeasons: 9, familyFriendly: 8 },
  },
  {
    id: 'gf-seoul-kr',
    name: 'Seoul', country: 'South Korea', region: 'Asia', costTier: 'Moderate',
    tagline: 'K-culture epicenter with blazing internet, great food, and nightlife.',
    scores: { walkability: 8, nature: 6, nightlife: 9, arts: 8, affordability: 4,
      techJobs: 7, transit: 10, beach: 3, mountains: 6, food: 10, diversity: 5,
      safety: 9, warmWeather: 6, fourSeasons: 8, familyFriendly: 7 },
  },
  {
    id: 'gf-singapore-sg',
    name: 'Singapore', country: 'Singapore', region: 'Asia', costTier: 'Very Expensive',
    tagline: 'Asia\'s global finance hub — immaculate, safe, and incredibly connected.',
    scores: { walkability: 7, nature: 6, nightlife: 7, arts: 7, affordability: 2,
      techJobs: 9, transit: 10, beach: 6, mountains: 1, food: 10, diversity: 10,
      safety: 10, warmWeather: 8, fourSeasons: 1, familyFriendly: 9 },
  },
  {
    id: 'gf-taipei-tw',
    name: 'Taipei', country: 'Taiwan', region: 'Asia', costTier: 'Moderate',
    tagline: 'Night markets, mountains, hot springs, and incredible value for money.',
    scores: { walkability: 7, nature: 7, nightlife: 7, arts: 7, affordability: 6,
      techJobs: 7, transit: 9, beach: 5, mountains: 7, food: 10, diversity: 5,
      safety: 9, warmWeather: 7, fourSeasons: 5, familyFriendly: 8 },
  },
  {
    id: 'gf-bangkok-th',
    name: 'Bangkok', country: 'Thailand', region: 'Asia', costTier: 'Budget',
    tagline: 'Endless street food, temples, and an unstoppable nightlife at bargain prices.',
    scores: { walkability: 5, nature: 5, nightlife: 10, arts: 7, affordability: 9,
      techJobs: 4, transit: 6, beach: 5, mountains: 3, food: 10, diversity: 7,
      safety: 6, warmWeather: 10, fourSeasons: 2, familyFriendly: 5 },
  },
  {
    id: 'gf-chiang-mai-th',
    name: 'Chiang Mai', country: 'Thailand', region: 'Asia', costTier: 'Budget',
    tagline: 'Top digital nomad hub — temples, jungle, and low cost of living.',
    scores: { walkability: 5, nature: 8, nightlife: 6, arts: 7, affordability: 10,
      techJobs: 3, transit: 3, beach: 1, mountains: 7, food: 9, diversity: 6,
      safety: 8, warmWeather: 8, fourSeasons: 4, familyFriendly: 7 },
  },
  {
    id: 'gf-bali-id',
    name: 'Bali', country: 'Indonesia', region: 'Asia', costTier: 'Budget',
    tagline: 'Rice paddies, surf, and the world\'s most popular remote-work paradise.',
    scores: { walkability: 3, nature: 10, nightlife: 7, arts: 8, affordability: 9,
      techJobs: 3, transit: 2, beach: 9, mountains: 6, food: 8, diversity: 7,
      safety: 7, warmWeather: 10, fourSeasons: 1, familyFriendly: 5 },
  },
  {
    id: 'gf-dubai-ae',
    name: 'Dubai', country: 'UAE', region: 'Africa & Middle East', costTier: 'Expensive',
    tagline: 'Zero income tax, global connectivity, and a futuristic skyline.',
    scores: { walkability: 4, nature: 3, nightlife: 7, arts: 5, affordability: 3,
      techJobs: 7, transit: 6, beach: 8, mountains: 3, food: 8, diversity: 10,
      safety: 9, warmWeather: 9, fourSeasons: 1, familyFriendly: 7 },
  },

  // ── Oceania ───────────────────────────────────────────────────
  {
    id: 'gf-melbourne-au',
    name: 'Melbourne', country: 'Australia', region: 'Oceania', costTier: 'Expensive',
    tagline: 'The cultural capital of Australia — coffee, sport, and incredible food.',
    scores: { walkability: 7, nature: 7, nightlife: 8, arts: 9, affordability: 2,
      techJobs: 6, transit: 7, beach: 6, mountains: 5, food: 9, diversity: 9,
      safety: 8, warmWeather: 7, fourSeasons: 8, familyFriendly: 8 },
  },
  {
    id: 'gf-sydney-au',
    name: 'Sydney', country: 'Australia', region: 'Oceania', costTier: 'Very Expensive',
    tagline: 'Opera House, harbour beaches, and an outdoor lifestyle like no other.',
    scores: { walkability: 7, nature: 7, nightlife: 8, arts: 8, affordability: 1,
      techJobs: 6, transit: 7, beach: 9, mountains: 5, food: 9, diversity: 9,
      safety: 8, warmWeather: 8, fourSeasons: 6, familyFriendly: 8 },
  },
  {
    id: 'gf-auckland-nz',
    name: 'Auckland', country: 'New Zealand', region: 'Oceania', costTier: 'Expensive',
    tagline: 'Volcanoes, vineyards, and access to some of the world\'s best nature.',
    scores: { walkability: 6, nature: 9, nightlife: 5, arts: 6, affordability: 3,
      techJobs: 5, transit: 5, beach: 7, mountains: 7, food: 7, diversity: 8,
      safety: 9, warmWeather: 6, fourSeasons: 8, familyFriendly: 9 },
  },

  // ── Africa & Middle East ──────────────────────────────────────
  {
    id: 'gf-cape-town-za',
    name: 'Cape Town', country: 'South Africa', region: 'Africa & Middle East', costTier: 'Budget',
    tagline: 'Table Mountain, world-class wine, beaches, and a booming tech scene.',
    scores: { walkability: 5, nature: 10, nightlife: 7, arts: 7, affordability: 8,
      techJobs: 4, transit: 4, beach: 9, mountains: 9, food: 8, diversity: 8,
      safety: 5, warmWeather: 8, fourSeasons: 7, familyFriendly: 6 },
  },
]

export const PREFERENCES: { id: keyof GlobalCity['scores']; label: string }[] = [
  { id: 'walkability',    label: 'Walkable' },
  { id: 'nature',        label: 'Nature & Outdoors' },
  { id: 'nightlife',     label: 'Nightlife' },
  { id: 'arts',          label: 'Arts & Culture' },
  { id: 'affordability', label: 'Affordable' },
  { id: 'techJobs',      label: 'Tech Jobs' },
  { id: 'transit',       label: 'Public Transit' },
  { id: 'beach',         label: 'Beach' },
  { id: 'mountains',     label: 'Mountains' },
  { id: 'food',          label: 'Food Scene' },
  { id: 'diversity',     label: 'Cosmopolitan' },
  { id: 'safety',        label: 'Safe' },
  { id: 'warmWeather',   label: 'Warm Climate' },
  { id: 'fourSeasons',   label: 'Four Seasons' },
  { id: 'familyFriendly','label': 'Family-Friendly' },
]

const COST_TIER_DEFAULTS: Record<CostTier, { rent: number; costOfLivingLevel: 'Low' | 'Medium' | 'High' | 'Very High' }> = {
  'Budget':         { rent: 700,  costOfLivingLevel: 'Low' },
  'Moderate':       { rent: 1400, costOfLivingLevel: 'Medium' },
  'Expensive':      { rent: 2200, costOfLivingLevel: 'High' },
  'Very Expensive': { rent: 3000, costOfLivingLevel: 'Very High' },
}

export function globalCityToCity(gc: GlobalCity): import('../types').City {
  const defaults = COST_TIER_DEFAULTS[gc.costTier]
  return {
    id: gc.id,
    name: gc.name,
    state: '',
    country: gc.country,
    costOfLivingLevel: defaults.costOfLivingLevel,
    comfortableSalary: 0,        // calculator will derive this
    estimatedRent: defaults.rent,
    estimatedMonthlyExpenses: defaults.rent * 2,
    topIndustries: [],
    topCompanies: [],
    newGradFitScore: Math.round((gc.scores.techJobs + gc.scores.diversity + gc.scores.safety) / 3),
    jobMarketStrength: gc.scores.techJobs,
    isCustom: true,
  }
}
