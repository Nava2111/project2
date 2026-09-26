/**
 * HerbaCart – Medicinal Herbs Store
 * Product Catalog & Static Data
 */

const HERB_PRODUCTS = [
  {
    id: 'tulsi',
    name: 'Tulsi (Holy Basil)',
    botanicalName: 'Ocimum sanctum',
    category: 'Immunity & Respiratory',
    categoryId: 'immunity',
    price: 180,
    originalPrice: 230,
    weight: '100g Pouch',
    rating: 4.9,
    reviewsCount: 142,
    inStock: true,
    stockCount: 38,
    image: 'assets/images/tulsi.jpg',
    shortDescription: 'Sacred Queen of Herbs renowned for boosting immunity, stress relief, and clear respiratory wellness.',
    fullDescription: 'Tulsi, revered in Ayurvedic medicine for millennia as the "Queen of Herbs", is a premier adaptogen. Our wild-harvested organic Krishna and Rama Tulsi leaves are shade-dried under optimal conditions to preserve high concentrations of eugenol, rosmarinic acid, and natural essential oils. Daily use strengthens the immune barrier, calms daily stress, and clears respiratory channels.',
    keyBenefits: [
      'Strengthens immune defense against seasonal ailments',
      'Naturally relieves stress and restores inner calmness',
      'Supports respiratory clarity and lung health',
      'Rich in potent bioflavonoids and antioxidants'
    ],
    howToUse: 'Brew 1 teaspoon in boiling water for 5–7 minutes as an aromatic herbal infusion, or take 1/2 teaspoon with warm water and raw honey twice a day.',
    ayurvedicProperties: 'Rasa: Katu (Pungent), Tikta (Bitter) | Virya: Ushna (Warm) | Tridosha: Balances Vata & Kapha',
    tags: ['Bestseller', '100% Organic', 'Immunity'],
    featured: true
  },
  {
    id: 'ashwagandha',
    name: 'Ashwagandha (Indian Ginseng)',
    botanicalName: 'Withania somnifera',
    category: 'Vitality & Stress Relief',
    categoryId: 'vitality',
    price: 320,
    originalPrice: 390,
    weight: '100g Pure Root Powder',
    rating: 4.8,
    reviewsCount: 215,
    inStock: true,
    stockCount: 45,
    image: 'assets/images/ashwagandha.jpg',
    shortDescription: 'Potent adaptogen that reduces cortisol, enhances physical stamina, and supports deep restorative sleep.',
    fullDescription: 'Ashwagandha is the cornerstone of Rasayana (rejuvenation therapy) in Ayurveda. Sourced from certified organic farms, our root powder is meticulously ground at low temperatures to ensure maximum withanolide potency. It nourishes the nervous system, supports adrenal health, reduces anxiety-induced fatigue, and builds long-term physical endurance.',
    keyBenefits: [
      'Helps lower cortisol levels and mitigates daily anxiety',
      'Enhances physical stamina, strength, and muscle tone',
      'Promotes deep, tranquil, and restorative sleep',
      'Nourishes the nervous system and improves mental vitality'
    ],
    howToUse: 'Mix 1/2 teaspoon (approx. 3g) into warm milk (or almond milk) with a touch of honey or cinnamon 30 minutes before bedtime.',
    ayurvedicProperties: 'Rasa: Tikta (Bitter), Kashaya (Astringent) | Virya: Ushna (Warm) | Tridosha: Pacifies Vata & Kapha',
    tags: ['Bestseller', 'Adaptogen', 'Stress Relief'],
    featured: true
  },
  {
    id: 'aloe-vera',
    name: 'Aloe Vera (Ghritkumari)',
    botanicalName: 'Aloe barbadensis miller',
    category: 'Skin & Digestive Care',
    categoryId: 'skin',
    price: 210,
    originalPrice: 260,
    weight: '200ml Pure Inner-Gel',
    rating: 4.7,
    reviewsCount: 168,
    inStock: true,
    stockCount: 29,
    image: 'assets/images/aloe_vera.jpg',
    shortDescription: 'Cooling botanical miracle for radiant skin hydration, gut lining health, and gentle internal detoxification.',
    fullDescription: 'Extracted from mature 3-year-old organic Aloe Vera leaves, this cold-stabilized inner fillet extract contains over 75 active bio-compounds, including acemannan polysaccharides and natural digestive enzymes. It provides cooling relief for internal digestive heat, supports healthy intestinal motility, and hydrates dry, sensitive skin.',
    keyBenefits: [
      'Deeply hydrates and restores skin moisture barrier',
      'Soothes digestive acidity and gastrointestinal irritation',
      'Promotes healthy scalp moisture and reduces dandruff',
      'Gentle natural daily body detoxifier'
    ],
    howToUse: 'For internal health: Mix 20ml in a cup of room-temperature water on an empty stomach every morning. For external skin/hair: Apply directly as a cooling gel.',
    ayurvedicProperties: 'Rasa: Tikta (Bitter), Madhura (Sweet) | Virya: Sheeta (Cooling) | Tridosha: Tridoshic (Balances all three)',
    tags: ['Cooling', 'Organic', 'Skin Health'],
    featured: false
  },
  {
    id: 'neem',
    name: 'Neem (Indian Lilac)',
    botanicalName: 'Azadirachta indica',
    category: 'Skin, Hair & Detox',
    categoryId: 'skin',
    price: 150,
    originalPrice: 195,
    weight: '100g Wildcrafted Leaf Powder',
    rating: 4.9,
    reviewsCount: 192,
    inStock: true,
    stockCount: 52,
    image: 'assets/images/neem.jpg',
    shortDescription: 'Nature’s quintessential antibacterial blood purifier for clear blemish-free skin and oral hygiene.',
    fullDescription: 'Celebrated in classical Sanskrit texts as "Sarva Roga Nivarini" (the universal cure), Neem has been India’s primary botanical cleanser for over 4,000 years. Our powder is crafted from shade-dried young spring leaves, offering high bio-activity to flush systemic toxins, eliminate stubborn acne-causing bacteria, and support scalp health.',
    keyBenefits: [
      'Purifies bloodstream and eliminates environmental toxins',
      'Effectively fights acne bacteria and clears blemishes',
      'Soothes itchy scalp, flaking, and skin inflammation',
      'Traditional support for gum health and natural oral hygiene'
    ],
    howToUse: 'Take 1/4 to 1/2 teaspoon with warm water after lunch, or mix with pure rose water/aloe vera into a clarifying weekly face mask.',
    ayurvedicProperties: 'Rasa: Tikta (Bitter), Kashaya (Astringent) | Virya: Sheeta (Cooling) | Tridosha: Calms Pitta & Kapha',
    tags: ['Bestseller', 'Detox', 'Skin Care'],
    featured: true
  },
  {
    id: 'turmeric',
    name: 'Turmeric (Lakadong Haldi)',
    botanicalName: 'Curcuma longa',
    category: 'Immunity & Joint Health',
    categoryId: 'immunity',
    price: 195,
    originalPrice: 250,
    weight: '150g High-Curcumin Powder',
    rating: 4.9,
    reviewsCount: 320,
    inStock: true,
    stockCount: 60,
    image: 'assets/images/turmeric.jpg',
    shortDescription: 'Vibrant golden rhizome rich in 7%+ curcumin for joint mobility, cellular healing, and anti-inflammatory defense.',
    fullDescription: 'Grown exclusively in the mineral-rich soil of Lakadong, Meghalaya, our turmeric boasts an extraordinarily high natural curcumin concentration of 7.2% (compared to regular culinary turmeric which yields only 2–3%). Curcumin is nature’s strongest natural anti-inflammatory compound, shielding joints and cells against oxidative degradation.',
    keyBenefits: [
      'Contains 7.2%+ natural active curcumin',
      'Supports healthy joint flexibility and muscle recovery',
      'Provides potent cellular defense against free radicals',
      'Imparts a natural, radiant inner skin glow'
    ],
    howToUse: 'Stir 1/2 teaspoon into warm milk with a crack of black pepper (to boost curcumin bioavailability by 2000%) before sleep.',
    ayurvedicProperties: 'Rasa: Tikta (Bitter), Katu (Pungent) | Virya: Ushna (Warm) | Tridosha: Balances all three doshas',
    tags: ['Bestseller', 'Lakadong 7% Curcumin', 'Joint Care'],
    featured: true
  },
  {
    id: 'ginger',
    name: 'Ginger Root (Sonth)',
    botanicalName: 'Zingiber officinale',
    category: 'Digestive Wellness',
    categoryId: 'digestion',
    price: 160,
    originalPrice: 200,
    weight: '100g Sun-Dried Root Powder',
    rating: 4.7,
    reviewsCount: 135,
    inStock: true,
    stockCount: 34,
    image: 'assets/images/ginger.jpg',
    shortDescription: 'Warming digestive spark (Agni deepana) that relieves bloating, nausea, and morning stiffness.',
    fullDescription: 'Hailed as "Vishwabhesaj" (the universal remedy), dried ginger powder (Sonth) possesses an unctuous, warming energy that sparks digestive fire without overheating the liver. It stimulates saliva and gastric enzymes, accelerates digestion, eases bloating, and warms cold extremities during seasonal changes.',
    keyBenefits: [
      'Stimulates digestive fire (Agni) and eases bloating/gas',
      'Relieves morning sluggishness, nausea, and motion sickness',
      'Soothes throat irritation, tickling cough, and chills',
      'Enhances circulation and systemic nutrient absorption'
    ],
    howToUse: 'Add 1/4 teaspoon to hot lemon water with a spoon of raw honey after meals, or incorporate into everyday herbal teas and broths.',
    ayurvedicProperties: 'Rasa: Katu (Pungent), Madhura (Sweet post-digestive) | Virya: Ushna (Warm) | Tridosha: Balances Vata & Kapha',
    tags: ['Digestive', 'Pure Sonth', 'Warmth'],
    featured: false
  },
  {
    id: 'brahmi',
    name: 'Brahmi (Gotu Kola)',
    botanicalName: 'Bacopa monnieri',
    category: 'Mind, Memory & Focus',
    categoryId: 'mind',
    price: 280,
    originalPrice: 340,
    weight: '100g Nootropic Herb Powder',
    rating: 4.9,
    reviewsCount: 184,
    inStock: true,
    stockCount: 26,
    image: 'assets/images/brahmi.jpg',
    shortDescription: 'Renowned ancient Medhya Rasayana for mental clarity, sharp memory recall, and peaceful concentration.',
    fullDescription: 'Brahmi is Ayurveda’s most revered nootropic herb, named after Brahma, the creative cosmic consciousness. Packed with natural bacosides, it strengthens neural communication across synapses, protects brain cells from oxidative stress, and helps students and professionals sustain calm focus without nervous fatigue.',
    keyBenefits: [
      'Enhances memory retention and cognitive processing speed',
      'Sustains sharp focus and concentration during long tasks',
      'Calms mental clutter, restlessness, and exam anxiety',
      'Nourishes and protects brain tissue from burnout'
    ],
    howToUse: 'Take 1/2 teaspoon with warm water, herbal tea, or a teaspoon of organic ghee each morning on an empty stomach.',
    ayurvedicProperties: 'Rasa: Tikta (Bitter), Kashaya (Astringent) | Virya: Sheeta (Cooling) | Tridosha: Balances Pitta & Vata',
    tags: ['Nootropic', 'Brain Tonic', 'Focus'],
    featured: false
  },
  {
    id: 'amla',
    name: 'Amla (Indian Gooseberry)',
    botanicalName: 'Phyllanthus emblica',
    category: 'Immunity & Hair Health',
    categoryId: 'immunity',
    price: 175,
    originalPrice: 225,
    weight: '150g Vitamin C Rich Powder',
    rating: 4.8,
    reviewsCount: 298,
    inStock: true,
    stockCount: 50,
    image: 'assets/images/amla.jpg',
    shortDescription: 'Super-concentrated natural Vitamin C for collagen synthesis, luminous hair strength, and youthful vigor.',
    fullDescription: 'Amla is the primary rejuvenating fruit of Ayurvedic longevity formulations (such as Chyawanprash). It is one of nature’s most concentrated sources of natural Vitamin C, bound with protective tannins that keep it stable even through processing. It nourishes hair follicles, prevents early greying, boosts collagen, and supports iron absorption.',
    keyBenefits: [
      'Natural whole-food source of high-potency Vitamin C',
      'Strengthens hair roots, delays greying, and boosts shine',
      'Encourages natural collagen production for youthful skin',
      'Aids healthy iron absorption and hemoglobin support'
    ],
    howToUse: 'Take 1 teaspoon with warm water, fresh juice, or mix with raw honey every morning before breakfast.',
    ayurvedicProperties: 'Rasa: Five Rasas (Pancharasa) except Salt | Virya: Sheeta (Cooling) | Tridosha: Balances Vata, Pitta, and Kapha',
    tags: ['Bestseller', 'Natural Vitamin C', 'Hair Care'],
    featured: false
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All Herbs', icon: '🌿', count: 8 },
  { id: 'immunity', name: 'Immunity & Respiratory', icon: '🛡️', count: 3 },
  { id: 'vitality', name: 'Vitality & Stress', icon: '⚡', count: 1 },
  { id: 'skin', name: 'Skin, Hair & Detox', icon: '🌸', count: 2 },
  { id: 'mind', name: 'Mind & Memory', icon: '🧠', count: 1 },
  { id: 'digestion', name: 'Digestive Health', icon: '🍵', count: 1 }
];

const COUPONS = {
  'HERBA10': { discountPercent: 10, description: '10% Off HerbaCart Welcome Offer' },
  'STUDENT15': { discountPercent: 15, description: '15% Off Student Herbal Discount' },
  'NATURE20': { discountPercent: 20, description: '20% Off Orders Above ₹500', minTotal: 500 }
};
