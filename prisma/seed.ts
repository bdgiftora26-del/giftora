// ============================================================================
// prisma/seed.ts — UpoharBd clone (Bangladesh gift-delivery e-commerce)
// Idempotent: clears tables in dependency order then inserts full sample data.
// Run with: `bun run db:seed`
// ============================================================================
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0980-\u09ff\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function pad(n: number, width = 3): string {
  return String(n).padStart(width, '0')
}

// Deterministic pseudo-random for reproducible seed
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}
const rand = rng(424242)
const ri = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const maybe = (p: number) => rand() < p

// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------

const citiesData = [
  { slug: 'dhaka', name: 'Dhaka', nameBn: 'ঢাকা', deliveryFeeBdt: 0, isFreeDelivery: false, sameDayCutoff: '14:00', sortOrder: 1 },
  { slug: 'chittagong', name: 'Chittagong', nameBn: 'চট্টগ্রাম', deliveryFeeBdt: 0, isFreeDelivery: true, sameDayCutoff: '14:00', sortOrder: 2 },
  { slug: 'sylhet', name: 'Sylhet', nameBn: 'সিলেট', deliveryFeeBdt: 0, isFreeDelivery: true, sameDayCutoff: '14:00', sortOrder: 3 },
]

const currenciesData = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rateFromBdt: 0.0091 },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rateFromBdt: 1 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rateFromBdt: 0.0072 },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', rateFromBdt: 0.0139 },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', rateFromBdt: 0.0125 },
  { code: 'EUR', symbol: '€', name: 'Euro', rateFromBdt: 0.0084 },
]

const vendorsData = [
  'Coopers', 'Well Food', 'Mr. Baker', 'Kings', 'Shumis Hot Cake',
  'Puro', 'Bread & Beyond', 'Dulce', 'Pizza Hut', 'KFC',
]

// ----- Category tree (42 top-level + city sub-trees) ------------------------
// Each entry: { name, icon, bn, children?: [{ name, bn }] }
type CatDef = { name: string; icon: string; bn: string; children?: { name: string; bn: string }[] }

const categoryTree: CatDef[] = [
  { name: 'Same Day and Urgent Gifts', icon: 'truck', bn: 'একই দিনে এবং জরুরি উপহার' },
  { name: 'Gift Packages for BD', icon: 'gift', bn: 'বাংলাদেশের জন্য উপহার প্যাকেজ' },
  // (#3 Chittagong City tree is added separately with cityId = chittagong)
  { name: 'Fresh Flower and Roses', icon: 'flower', bn: 'তাজা ফুল এবং গোলাপ' },
  { name: 'Fresh Fruits and Juices', icon: 'fruit', bn: 'তাজা ফল এবং রস' },
  { name: 'Groceries and Bazar', icon: 'cart', bn: 'মুদি এবং বাজার' },
  { name: 'Chocolate, Ice Cream & Cookies', icon: 'chocolate', bn: 'চকলেট, আইসক্রিম ও কুকিজ' },
  { name: 'Teddy Bear and Soft Toys', icon: 'teddy', bn: 'টেডি বিয়ার এবং সফট টয়' },
  { name: 'Medical and Healthcare', icon: 'heart', bn: 'চিকিৎসা ও স্বাস্থ্যসেবা' },
  { name: 'Cake from Well Food', icon: 'cake-wellfood', bn: 'ওয়েল ফুড কেক' },
  {
    name: 'Cake from Coopers', icon: 'cake-coopers', bn: 'কুপার্স কেক',
    children: [
      { name: 'Cake for Urgent order', bn: 'জরুরি অর্ডারের জন্য কেক' },
      { name: 'Cartoon Shape Cakes', bn: 'কার্টুন আকৃতির কেক' },
      { name: 'Round Shape Cakes', bn: 'গোল আকৃতির কেক' },
      { name: 'Square Shape Cakes', bn: 'চৌকো আকৃতির কেক' },
      { name: 'Heart Shape Cakes', bn: 'হৃদয় আকৃতির কেক' },
      { name: 'Cakes with Special Art', bn: 'বিশেষ শিল্প সহ কেক' },
    ],
  },
  { name: 'Cakes from Mr. Baker', icon: 'cake-mrbaker', bn: 'মিস্টার বেকার কেক' },
  { name: 'Kings Confectionery Cakes', icon: 'cake-kings', bn: 'কিংস কনফেকশনারি কেক' },
  { name: 'Shumis Hot Cake', icon: 'cake-shumis', bn: 'শুমিস হট কেক' },
  { name: 'Puro Pastry and Bakery', icon: 'cake-puro', bn: 'পুরো পেস্ট্রি এবং বেকারি' },
  { name: 'Bread and Beyond Cakes', icon: 'cake-bread', bn: 'ব্রেড অ্যান্ড বিয়ন্ড কেক' },
  { name: 'Special Cake and Pastry', icon: 'cake', bn: 'বিশেষ কেক এবং পেস্ট্রি' },
  {
    name: 'Food Court', icon: 'food', bn: 'ফুড কোর্ট',
    children: [
      { name: 'Biryani and Deshi Food', bn: 'বিরিয়ানি এবং দেশি খাবার' },
      { name: 'Kebab - Burger - Snacks', bn: 'কাবাব - বার্গার - স্ন্যাকস' },
      { name: 'Bangladeshi Pitha', bn: 'বাংলাদেশি পিঠা' },
      { name: 'Chinese and Thai Food', bn: 'চাইনিজ এবং থাই খাবার' },
      { name: 'Pizza Hut Deals', bn: 'পিজ্জা হাট ডিলস' },
      { name: 'BFC Fast Food', bn: 'বিএফসি ফাস্ট ফুড' },
      { name: 'KFC Meal Deals', bn: 'কেএফসি মিল ডিলস' },
      { name: 'Diabetic food items', bn: 'ডায়াবেটিক খাবার' },
      { name: 'Chocolate and Ice Cream', bn: 'চকলেট এবং আইসক্রিম' },
      { name: 'Paan Supari Packages', bn: 'পান সুপারি প্যাকেজ' },
      { name: 'Iftar Items', bn: 'ইফতারের আইটেম' },
      { name: 'Harfy', bn: 'হারফি' },
    ],
  },
  { name: 'Personalised Gifts', icon: 'gift', bn: 'পার্সোনালাইজড উপহার' },
  {
    name: 'Misti and sweets', icon: 'sweets', bn: 'মিষ্টি এবং মিষ্টান্ন',
    children: [
      { name: 'Sweets Package', bn: 'মিষ্টি প্যাকেজ' },
      { name: 'Rosh Sweets', bn: 'রশ মিষ্টি' },
      { name: 'Premium Sweets', bn: 'প্রিমিয়াম মিষ্টি' },
      { name: 'Bonoful Sweets', bn: 'বনফুল মিষ্টি' },
      { name: 'Moron Chad Sweets', bn: 'মোরন চাঁদ মিষ্টি' },
      { name: 'Bikrampur Mistanno Vander', bn: 'বিক্রমপুর মিষ্টান্ন ভান্ডার' },
      { name: 'Tangail Sweets', bn: 'টাঙ্গাইল মিষ্টি' },
      { name: 'Meena Sweets', bn: 'মীনা মিষ্টি' },
    ],
  },
  {
    name: 'Gifts and Dress for Her', icon: 'dress', bn: 'তার জন্য উপহার এবং পোশাক',
    children: [
      { name: 'Exclusive Saree For Her', bn: 'তার জন্য এক্সক্লুসিভ শাড়ি' },
      { name: 'Latest Salwar Kameez', bn: 'সর্বশেষ সালোয়ার কামিজ' },
      { name: 'Perfume and Fashion for her', bn: 'তার জন্য পারফিউম ও ফ্যাশন' },
      { name: 'Roses Only for her', bn: 'তার জন্য শুধু গোলাপ' },
      { name: 'Cake with love', bn: 'ভালোবাসা সহ কেক' },
    ],
  },
  {
    name: 'Eid Gift Ideas', icon: 'eid', bn: 'ঈদ উপহার আইডিয়া',
    children: [
      { name: 'Eid Saree', bn: 'ঈদের শাড়ি' },
      { name: 'Eid Salwar Kameez', bn: 'ঈদের সালোয়ার কামিজ' },
      { name: 'Eid Bazaar', bn: 'ঈদের বাজার' },
      { name: 'Eid Gift Packages', bn: 'ঈদ উপহার প্যাকেজ' },
      { name: 'Eid Panjabi', bn: 'ঈদের পাঞ্জাবি' },
      { name: 'Home Decor', bn: 'হোম ডেকর' },
    ],
  },
  {
    name: 'Gifts and Dress for Him', icon: 'him', bn: 'তার জন্য উপহার এবং পোশাক',
    children: [
      { name: 'Panjabi and Fotua', bn: 'পাঞ্জাবি এবং ফোটুয়া' },
      { name: 'Shirt and Pants', bn: 'শার্ট এবং প্যান্ট' },
      { name: 'Perfume and Accessories', bn: 'পারফিউম এবং আনুষঙ্গিক' },
    ],
  },
  {
    name: 'Gifts and Toys for Kids', icon: 'kids', bn: 'বাচ্চাদের জন্য উপহার ও খেলনা',
    children: [
      { name: 'Kids Birthday Package', bn: 'বাচ্চাদের জন্মদিনের প্যাকেজ' },
      { name: 'Kids Learning Materials', bn: 'বাচ্চাদের শেখার উপকরণ' },
      { name: 'Toys', bn: 'খেলনা' },
      { name: 'Games and Sports gift', bn: 'খেলা ও ক্রীড়া উপহার' },
      { name: 'Chocolate, Ice Cream & Cookies', bn: 'চকলেট, আইসক্রিম ও কুকিজ' },
      { name: 'Teddy Bear and Soft Toys', bn: 'টেডি বিয়ার এবং সফট টয়' },
      { name: 'Cartoon cakes', bn: 'কার্টুন কেক' },
    ],
  },
  { name: 'Online Mobile Recharge', icon: 'mobile', bn: 'অনলাইন মোবাইল রিচার্জ' },
  { name: 'Aquarium, Plant, Pet, Hobby Gifts', icon: 'pet', bn: 'অ্যাকোয়ারিয়াম, উদ্ভিদ, পোষা প্রাণী, শখের উপহার' },
  { name: 'Wedding Gifts in Bangladesh', icon: 'wedding', bn: 'বাংলাদেশে বিবাহ উপহার' },
  { name: 'Unilever Gift Hampers', icon: 'hamper', bn: 'ইউনিলিভার গিফট হ্যাম্পার' },
  { name: 'Newborn and baby gift', icon: 'baby', bn: 'নবজাতক ও শিশুর উপহার' },
  { name: 'Home Decor and Appliance', icon: 'decor', bn: 'হোম ডেকর এবং অ্যাপ্লায়েন্স' },
  { name: 'Handicrafts of Bangladesh', icon: 'handicraft', bn: 'বাংলাদেশের হস্তশিল্প' },
  { name: 'Greetings Card', icon: 'card', bn: 'গ্রিটিংস কার্ড' },
  {
    name: 'Music - Novel - Natok', icon: 'music', bn: 'সঙ্গীত - নভেল - নাটক',
    children: [
      { name: 'New Release Book and CD', bn: 'নতুন প্রকাশিত বই ও সিডি' },
      { name: 'Humayun Ahmed', bn: 'হুমায়ূন আহমেদ' },
      { name: 'Imdadul Haq Milon', bn: 'ইমদাদুল হক মিলন' },
      { name: 'Indian Writer', bn: 'ভারতীয় লেখক' },
      { name: 'Muhammod Jafor Iqbal', bn: 'মুহম্মদ জাফর ইকবাল' },
      { name: 'Miscellaneous', bn: 'বিবিধ' },
    ],
  },
  { name: 'Corporate Promotional Gifts', icon: 'corporate', bn: 'কর্পোরেট প্রমোশনাল উপহার' },
  { name: 'Gifts for Puja and Holi', icon: 'puja', bn: 'পূজা এবং হোলির উপহার' },
  { name: 'Friendship Day Gift', icon: 'friendship', bn: 'ফ্রেন্ডশিপ ডে উপহার' },
  { name: 'New Year and Christmas gift', icon: 'newyear', bn: 'নববর্ষ ও বড়দিনের উপহার' },
  { name: 'Valentines Day Gift Packages', icon: 'valentine', bn: 'ভ্যালেন্টাইন্স ডে উপহার প্যাকেজ' },
  { name: 'Ramadan and Iftar Gifts', icon: 'ramadan', bn: 'রমজান এবং ইফতার উপহার' },
  { name: 'Pohela Boishakh Gifts', icon: 'boishakh', bn: 'পহেলা বৈশাখ উপহার' },
  { name: 'Fathers Day Gifts', icon: 'father', bn: 'পিতৃ দিবসের উপহার' },
  { name: 'Mothers Day Gift', icon: 'mother', bn: 'মাতৃ দিবসের উপহার' },
]

const cityTreeChildren = [
  { name: 'Gift Packages', bn: 'উপহার প্যাকেজ' },
  { name: 'Same Day Urgent Gift', bn: 'একই দিনে জরুরি উপহার' },
  { name: 'Food Delivery', bn: 'খাবার ডেলিভারি' },
  { name: 'Fresh Flowers', bn: 'তাজা ফুল' },
  { name: 'Sweets and Pitha', bn: 'মিষ্টি এবং পিঠা' },
  { name: 'Teddy bear and Toys', bn: 'টেডি বিয়ার এবং খেলনা' },
]

// ----- Product specs --------------------------------------------------------
type ProductType = 'PHYSICAL' | 'DIGITAL' | 'PERSONALISED'
type StockMode = 'UNLIMITED' | 'TRACKED'

interface ProductSpec {
  name: string
  bnName: string
  sku: string
  priceBdt: number
  salePriceBdt?: number
  imagePrefix: string
  categorySlugs: string[]
  vendorSlug?: string
  isCake?: boolean
  type?: ProductType
  stockMode?: StockMode
  stockQty?: number
  enShort: string
  enDesc: string
  bnShort: string
}

// Catalogue of product definitions per category.
const teddyNames: [string, string][] = [
  ['Cream teddy wearing koti', 'ক্রিম টেডি কোটি পরিহিত'],
  ['Brown fluffy teddy bear', 'বাদামি ফ্লাফি টেডি বিয়ার'],
  ['Pink plush bunny rabbit', 'গোলাপি প্লাশ খরগোশ'],
  ['Giant white teddy bear', 'বিশাল সাদা টেডি বিয়ার'],
  ['Cute puppy soft toy', 'কিউট কুকুরের সফট টয়'],
  ['Honey bear plush', 'হানি বিয়ার প্লাশ'],
  ['Pink teddy with heart', 'হৃদয় সহ গোলাপি টেডি'],
  ['Cuddly elephant soft toy', 'কাডলি হাতি সফট টয়'],
  ['White teddy with red bow', 'লাল বো সহ সাদা টেডি'],
  ['Beige teddy bear medium', 'বেইজ টেডি বিয়ার মিডিয়াম'],
  ['Soft monkey plush toy', 'সফট বানর প্লাশ টয়'],
  ['Brown teddy with scarf', 'স্কার্ফ সহ বাদামি টেডি'],
  ['Golden teddy bear', 'সোনালী টেডি বিয়ার'],
  ['Pink bunny with carrot', 'গাজর সহ গোলাপি বানি'],
  ['Tan teddy bear large', 'ট্যান টেডি বিয়ার লার্জ'],
  ['White polar bear plush', 'সাদা পোলার বিয়ার প্লাশ'],
  ['Cute cat soft toy', 'কিউট বিড়াল সফট টয়'],
  ['Yellow duckling plush', 'হলুদ ডাকলিং প্লাশ'],
  ['Brown bear with gift box', 'উপহার বাক্স সহ বাদামি বিয়ার'],
  ['Pink poodle plush', 'গোলাপি পুডল প্লাশ'],
  ['Tan teddy with ribbon', 'রিবন সহ ট্যান টেডি'],
  ['Snow leopard plush', 'স্নো লেপার্ড প্লাশ'],
  ['Mini teddy keychain', 'মিনি টেডি কিচেইন'],
  ['Soft panda toy', 'সফট পান্ডা টয়'],
  ['Brown teddy with chocolates', 'চকলেট সহ বাদামি টেডি'],
]

const flowerNames: [string, string][] = [
  ['Five red roses bouquet', 'পাঁচটি লাল গোলাপের তোড়া'],
  ['Ten red roses bunch', 'দশটি লাল গোলাপের বান্ডিল'],
  ['Mixed roses bouquet', 'মিশ্র গোলাপের তোড়া'],
  ['White lilies bouquet', 'সাদা লিলি তোড়া'],
  ['Pink carnations arrangement', 'গোলাপি কার্নেশন সাজানো'],
  ['Yellow gerberas bouquet', 'হলুদ গারবেরা তোড়া'],
  ['Mixed seasonal flowers', 'মিশ্র মৌসুমি ফুল'],
  ['Red roses in vase', 'ভদায় লাল গোলাপ'],
  ['Twenty red roses basket', 'বিশটি লাল গোলাপের ঝুড়ি'],
  ['Pink and white roses bunch', 'গোলাপি ও সাদা গোলাপের বান্ডিল'],
]

const coopersCakes: { name: string; bn: string; child: string; price: number }[] = [
  { name: 'Chocolate truffle cake 1lb', bn: 'চকলেট ট্রাফল কেক ১ পাউন্ড', child: 'round-shape-cakes', price: 1200 },
  { name: 'Vanilla cream cake 1lb', bn: 'ভ্যানিলা ক্রিম কেক ১ পাউন্ড', child: 'round-shape-cakes', price: 1100 },
  { name: 'Strawberry cream cake 1lb', bn: 'স্ট্রবেরি ক্রিম কেক ১ পাউন্ড', child: 'round-shape-cakes', price: 1150 },
  { name: 'Black forest cake 1lb', bn: 'ব্ল্যাক ফরেস্ট কেক ১ পাউন্ড', child: 'square-shape-cakes', price: 1300 },
  { name: 'Pineapple cream cake 1lb', bn: 'আনারস ক্রিম কেক ১ পাউন্ড', child: 'square-shape-cakes', price: 1250 },
  { name: 'Heart shape chocolate cake', bn: 'হৃদয় আকৃতির চকলেট কেক', child: 'heart-shape-cakes', price: 1450 },
  { name: 'Heart shape red velvet cake', bn: 'হৃদয় আকৃতির রেড ভেলভেট কেক', child: 'heart-shape-cakes', price: 1550 },
  { name: 'Cartoon spiderman cake', bn: 'কার্টুন স্পাইডারম্যান কেক', child: 'cartoon-shape-cakes', price: 1800 },
  { name: 'Cartoon princess cake', bn: 'কার্টুন রাজকন্যা কেক', child: 'cartoon-shape-cakes', price: 1850 },
  { name: 'Cartoon minions cake', bn: 'কার্টুন মিনিয়নস কেক', child: 'cartoon-shape-cakes', price: 1750 },
  { name: 'Special art photo cake', bn: 'বিশেষ শিল্প ফটো কেক', child: 'cakes-with-special-art', price: 2200 },
  { name: 'Coffee mocha urgent cake', bn: 'কফি মোচা জরুরি কেক', child: 'cake-for-urgent-order', price: 1350 },
]

const wellFoodCakes: [string, string, number][] = [
  ['Well Food chocolate cake', 'ওয়েল ফুড চকলেট কেক', 1100],
  ['Well Food vanilla cake', 'ওয়েল ফুড ভ্যানিলা কেক', 1000],
  ['Well Food black forest', 'ওয়েল ফুড ব্ল্যাক ফরেস্ট', 1250],
  ['Well Food butterscotch cake', 'ওয়েল ফুড বাটারস্কচ কেক', 1300],
  ['Well Food mango cake', 'ওয়েল ফুড আম কেক', 1150],
  ['Well Food strawberry cake', 'ওয়েল ফুড স্ট্রবেরি কেক', 1150],
]

const mrBakerCakes: [string, string, number][] = [
  ['Mr Baker chocolate fudge cake', 'মিস্টার বেকার চকলেট ফজ কেক', 1300],
  ['Mr Baker vanilla sponge', 'মিস্টার বেকার ভ্যানিলা স্পঞ্জ', 1150],
  ['Mr Baker black forest', 'মিস্টার বেকার ব্ল্যাক ফরেস্ট', 1400],
  ['Mr Baker tiramisu cake', 'মিস্টার বেকার তিরামিসু কেক', 1500],
  ['Mr Baker fruit cake', 'মিস্টার বেকার ফলের কেক', 1450],
  ['Mr Baker red velvet', 'মিস্টার বেকার রেড ভেলভেট', 1600],
]

const foodCourtItems: { name: string; bn: string; child: string; price: number }[] = [
  { name: 'Kacchi biryani platter', bn: 'কাচ্চি বিরিয়ানি প্লেট', child: 'biryani-and-deshi-food', price: 650 },
  { name: 'Chicken biryani platter', bn: 'মুরগি বিরিয়ানি প্লেট', child: 'biryani-and-deshi-food', price: 450 },
  { name: 'Beef tehari plate', bn: 'গরুর তেহারি প্লেট', child: 'biryani-and-deshi-food', price: 420 },
  { name: 'Chicken burger combo', bn: 'মুরগির বার্গার কম্বো', child: 'kebab-burger-snacks', price: 380 },
  { name: 'Beef burger meal', bn: 'গরুর বার্গার মিল', child: 'kebab-burger-snacks', price: 450 },
  { name: 'Chicken shawarma plate', bn: 'মুরগির শাওয়ারমা প্লেট', child: 'kebab-burger-snacks', price: 320 },
  { name: 'Veggie fried rice', bn: 'ভেজি ফ্রাইড রাইস', child: 'chinese-and-thai-food', price: 360 },
  { name: 'Chicken chilli masala', bn: 'মুরগির চিলি মসলা', child: 'chinese-and-thai-food', price: 420 },
  { name: 'Pizza margherita 12 inch', bn: 'পিজ্জা মার্গারিটা ১২ ইঞ্চি', child: 'pizza-hut-deals', price: 750 },
  { name: 'Fried chicken bucket', bn: 'ফ্রাইড চিকেন বাকেট', child: 'kfc-meal-deals', price: 980 },
  { name: 'KFC meal deal for two', bn: 'কেএফসি মিল ডিল দুজনের জন্য', child: 'kfc-meal-deals', price: 1150 },
  { name: 'Bangladeshi pitha assorted', bn: 'বাংলাদেশি পিঠা বিবিধ', child: 'bangladeshi-pitha', price: 480 },
]

const chocolateItems: [string, string, number][] = [
  ['Assorted chocolates gift box', 'বিভিন্ন চকলেট গিফট বক্স', 950],
  ['Belgian chocolate truffles', 'বেলজিয়ান চকলেট ট্রাফল', 1200],
  ['Ice cream tubs assorted', 'আইসক্রিম টাব বিবিধ', 720],
  ['Chocolate chip cookies jar', 'চকলেট চিপ কুকিজ জার', 540],
  ['Premium chocolate hamper', 'প্রিমিয়াম চকলেট হ্যাম্পার', 1850],
  ['Dark chocolate bars pack', 'ডার্ক চকলেট বার প্যাক', 680],
  ['Ice cream cake roll', 'আইসক্রিম কেক রোল', 890],
  ['Cookie gift basket', 'কুকি গিফট বাস্কেট', 760],
]

const herGifts: { name: string; bn: string; child: string; price: number }[] = [
  { name: 'Exclusive silk saree', bn: 'এক্সক্লুসিভ সিল্ক শাড়ি', child: 'exclusive-saree-for-her', price: 4800 },
  { name: 'Designer cotton saree', bn: 'ডিজাইনার কটন শাড়ি', child: 'exclusive-saree-for-her', price: 2600 },
  { name: 'Embroidered salwar kameez', bn: 'এমব্রয়ডারি সালোয়ার কামিজ', child: 'latest-salwar-kameez', price: 3200 },
  { name: 'Latest lawn salwar kameez', bn: 'সর্বশেষ লন সালোয়ার কামিজ', child: 'latest-salwar-kameez', price: 2400 },
  { name: 'Perfume gift set for her', bn: 'তার জন্য পারফিউম গিফট সেট', child: 'perfume-and-fashion-for-her', price: 1900 },
  { name: 'Fashion jewelry gift set', bn: 'ফ্যাশন জুয়েলরি গিফট সেট', child: 'perfume-and-fashion-for-her', price: 1500 },
  { name: 'Roses only for her', bn: 'তার জন্য শুধু গোলাপ', child: 'roses-only-for-her', price: 1800 },
  { name: 'Cake with love combo', bn: 'ভালোবাসা কেক কম্বো', child: 'cake-with-love', price: 2200 },
]

const himGifts: { name: string; bn: string; child: string; price: number }[] = [
  { name: 'Panjabi with embroidery', bn: 'এমব্রয়ডারি পাঞ্জাবি', child: 'panjabi-and-fotua', price: 1800 },
  { name: 'Cotton fotua panjabi', bn: 'কটন ফোটুয়া পাঞ্জাবি', child: 'panjabi-and-fotua', price: 1200 },
  { name: 'Formal shirt and pants combo', bn: 'ফর্মাল শার্ট ও প্যান্ট কম্বো', child: 'shirt-and-pants', price: 2600 },
  { name: 'Casual shirt combo', bn: 'ক্যাজুয়াল শার্ট কম্বো', child: 'shirt-and-pants', price: 1600 },
  { name: 'Perfume and accessories gift', bn: 'পারফিউম ও আনুষঙ্গিক উপহার', child: 'perfume-and-accessories', price: 2100 },
  { name: 'Leather wallet and belt set', bn: 'চামড়ার ওয়ালেট ও বেল্ট সেট', child: 'perfume-and-accessories', price: 1750 },
]

const personalisedGifts: [string, string, number][] = [
  ['Personalised photo frame', 'পার্সোনালাইজড ফটো ফ্রেম', 950],
  ['Custom name mug', 'কাস্টম নেম মাগ', 480],
  ['Personalised photo clock', 'পার্সোনালাইজড ফটো ঘড়ি', 1300],
  ['Custom message cushion', 'কাস্টম মেসেজ কুশন', 850],
  ['Personalised crystal plaque', 'পার্সোনালাইজড ক্রিস্টাল প্লাক', 1600],
  ['Photo engraved keychain', 'ফটো খোদাই কিচেইন', 360],
]

const mobileRecharge: [string, string, number][] = [
  ['Mobile recharge 100 BDT', 'মোবাইল রিচার্জ ১০০ টাকা', 100],
  ['Mobile recharge 250 BDT', 'মোবাইল রিচার্জ ২৫০ টাকা', 250],
  ['Mobile recharge 500 BDT', 'মোবাইল রিচার্জ ৫০০ টাকা', 500],
  ['Mobile recharge 1000 BDT', 'মোবাইল রিচার্জ ১০০০ টাকা', 1000],
]

const sweetsItems: { name: string; bn: string; child: string; price: number }[] = [
  { name: 'Bonoful rosgolla 1kg', bn: 'বনফুল রসগোল্লা ১ কেজি', child: 'bonoful-sweets', price: 580 },
  { name: 'Premium sweets assorted 2kg', bn: 'প্রিমিয়াম মিষ্টি বিবিধ ২ কেজি', child: 'premium-sweets', price: 1450 },
  { name: 'Rosh sweets gift pack', bn: 'রশ মিষ্টি গিফট প্যাক', child: 'rosh-sweets', price: 720 },
  { name: 'Moron chand sondesh pack', bn: 'মোরন চাঁদ সন্দেশ প্যাক', child: 'moron-chad-sweets', price: 680 },
  { name: 'Bikrampur mistanno box', bn: 'বিক্রমপুর মিষ্টান্ন বক্স', child: 'bikrampur-mistanno-vander', price: 820 },
  { name: 'Tangail sweets special', bn: 'টাঙ্গাইল মিষ্টি স্পেশাল', child: 'tangail-sweets', price: 760 },
  { name: 'Meena sweets assortment', bn: 'মীনা মিষ্টি বিবিধ', child: 'meena-sweets', price: 540 },
  { name: 'Sweets package 3kg', bn: 'মিষ্টি প্যাকেজ ৩ কেজি', child: 'sweets-package', price: 1780 },
]

const fruitItems: [string, string, number][] = [
  ['Fresh fruit basket medium', 'তাজা ফলের ঝুড়ি মিডিয়াম', 1200],
  ['Premium fruit hamper large', 'প্রিমিয়াম ফল হ্যাম্পার লার্জ', 2200],
  ['Seasonal fruit assortment', 'মৌসুমি ফলের বিভিন্নতা', 980],
  ['Apple and grapes basket', 'আপেল ও আঙ্গুর ঝুড়ি', 850],
  ['Exotic fruit basket', 'এক্সোটিক ফলের ঝুড়ি', 1850],
  ['Mixed fruit gift box', 'মিশ্র ফল গিফট বক্স', 1100],
]

const groceriesItems: [string, string, number][] = [
  ['Monthly grocery hamper', 'মাসিক মুদি হ্যাম্পার', 2400],
  ['Rice and dal family pack', 'চাল ও ডাল ফ্যামিলি প্যাক', 1200],
  ['Cooking oil and spices kit', '�ান্নার তেল ও মসলা কিট', 980],
  ['Tea and snacks combo', 'চা ও স্ন্যাকস কম্বো', 720],
  ['Unilever household hamper', 'ইউনিলিভার হাউজহোল্ড হ্যাম্পার', 1650],
  ['Dry groceries gift pack', 'শুকনা মুদি গিফট প্যাক', 1450],
]

// ---------------------------------------------------------------------------
// Banner definitions
// ---------------------------------------------------------------------------
const mosaicBanners = [
  {
    title: 'Free with every delivery',
    sortOrder: 1,
    imageUrl: '/placeholders/mosaic/roses.svg',
    link: '/gift-packages-for-bd',
    payload: JSON.stringify({
      kind: 'free-list',
      heading: 'Free with every delivery',
      items: ['Five red roses', 'Gift wrapping', 'Card & Candle', 'Photo confirmation'],
    }),
  },
  {
    title: 'Overlapping circles - delivery info',
    sortOrder: 2,
    imageUrl: null,
    link: null,
    payload: JSON.stringify({
      kind: 'overlapping-circles',
      circles: [
        { color: 'blue', heading: '7 Days', sub: '7am to 9pm', foot: 'DELIVERY TO ALL CITIES' },
        { color: 'red', heading: 'FREE', sub: '', foot: 'GIFT DELIVERY IN DHAKA' },
        { color: 'teal', heading: '5% OFF', sub: 'ALL PACKAGES', foot: 'Discount Code — GIFT —' },
        { color: 'lime', heading: 'URGENT & SAME DAY', sub: '', foot: 'DELIVERY AVAILABLE' },
      ],
    }),
  },
  {
    title: 'Fresh flower delivery',
    sortOrder: 3,
    imageUrl: '/placeholders/mosaic/flowers.svg',
    link: '/fresh-flower-and-roses',
    payload: JSON.stringify({
      kind: 'promo',
      heading: 'Fresh flower delivery',
      sub: '10% Discount code: Summer',
      ctaLabel: 'View Options',
      ribbon: 'Special',
    }),
  },
  {
    title: '5%-10% Off Sale Items',
    sortOrder: 4,
    imageUrl: '/placeholders/mosaic/sale.svg',
    link: '/saleitems',
    payload: JSON.stringify({
      kind: 'promo',
      heading: '5%-10% Off',
      sub: 'Sale Items',
      ctaLabel: 'Order Now',
    }),
  },
  {
    title: 'Personalized gifts in Bangladesh',
    sortOrder: 5,
    imageUrl: '/placeholders/mosaic/personalised.svg',
    link: '/personalised-gifts',
    payload: JSON.stringify({
      kind: 'promo',
      heading: 'Personalized gifts in Bangladesh',
      ctaLabel: 'Customize your gift',
    }),
  },
  {
    title: 'Free gift delivery in Chittagong',
    sortOrder: 6,
    imageUrl: '/placeholders/mosaic/chittagong.svg',
    link: '/chittagong-city-free-gift-delivery',
    payload: JSON.stringify({
      kind: 'promo',
      heading: 'Free gift delivery in Chittagong',
      ctaLabel: 'View gifts for Chittagong',
    }),
  },
  {
    title: 'Bengali tagline block',
    sortOrder: 7,
    imageUrl: '/placeholders/mosaic/teddy.svg',
    link: '/about-us',
    payload: JSON.stringify({
      kind: 'promo',
      heading: 'উপহার পাঠান — কাছে থাকুন উপহারবিডি.কম',
      ctaLabel: 'About Us',
      image: '/placeholders/mosaic/teddy.svg',
    }),
  },
]

const tileBanners: { title: string; link: string }[] = [
  { title: 'Same Day Gift Delivery', link: '/same-day-and-urgent-gifts' },
  { title: 'Save With Gift Packages', link: '/gift-packages-for-bd' },
  { title: 'Gift in Chittagong', link: '/chittagong-city-free-gift-delivery' },
  { title: 'Send Fresh Flower', link: '/fresh-flower-and-roses' },
  { title: 'Fruit Baskets', link: '/fresh-fruits-and-juices' },
  { title: 'Groceries Home Delivery', link: '/groceries-and-bazar' },
  { title: 'Treat For Loved-one', link: '/gift-packages-for-bd' },
  { title: 'Gift & Dress For Her', link: '/gifts-and-dress-for-her' },
  { title: 'Gift for Him', link: '/gifts-and-dress-for-him' },
  { title: 'Customised Gifts', link: '/personalised-gifts' },
  { title: 'Photograph Cake', link: '/cake-from-coopers' },
  { title: 'Gift Ideas For Kids', link: '/gifts-and-toys-for-kids' },
  { title: 'Chocolate & Ice Cream', link: '/chocolate-ice-cream-cookies' },
  { title: 'Teddy Bear & Toys', link: '/teddy-bear-and-soft-toys' },
  { title: 'Wedding & Anniversary', link: '/wedding-gifts-in-bangladesh' },
  { title: 'Pet - Plant - Hobby', link: '/aquarium-plant-pet-hobby-gifts' },
  { title: 'Mr. Baker Cake', link: '/cakes-from-mr-baker' },
  { title: 'পিঠা delivery', link: '/food-court/bangladeshi-pitha' },
  { title: 'Shumis Hot Cake', link: '/shumis-hot-cake' },
  { title: 'Well Food Cake', link: '/cake-from-well-food' },
  { title: 'Cartoon Cake', link: '/cake-from-coopers/cartoon-shape-cakes' },
  { title: 'Recharge Mobile Online', link: '/online-mobile-recharge' },
  { title: 'Coopers Cake', link: '/cake-from-coopers' },
  { title: 'Pizza Home Delivery', link: '/food-court/pizza-hut-deals' },
  { title: 'KFC Home Delivery', link: '/food-court/kfc-meal-deals' },
  { title: 'Sweets', link: '/misti-and-sweets' },
  { title: 'Handicrafts', link: '/handicrafts-of-bangladesh' },
  { title: 'Home Decor', link: '/home-decor-and-appliance' },
  { title: 'Healthcare for All', link: '/medical-and-healthcare' },
  { title: 'Appliances', link: '/home-decor-and-appliance' },
  { title: 'Newborn and Baby', link: '/newborn-and-baby-gift' },
  { title: 'Gift for Puja', link: '/gifts-for-puja-and-holi' },
  { title: 'Eid Gift Ideas', link: '/eid-gift-ideas' },
  { title: 'Pohela Boishakh Gifts', link: '/pohela-boishakh-gifts' },
  { title: 'Valentines Day Gifts', link: '/valentines-day-gift-packages' },
  { title: 'Corporate Gift', link: '/corporate-promotional-gifts' },
  { title: 'Fathers Day Gift Ideas', link: '/fathers-day-gifts' },
]

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------
const testimonialsData: { name: string; country: string; message: string; rating: number; approved: boolean }[] = [
  { name: 'Rahim Ahmed', country: 'USA', message: 'Delivered on time and the cake was fresh. My mother was so happy!', rating: 5, approved: true },
  { name: 'Fatema Begum', country: 'UK', message: 'Excellent service — the flowers were beautiful and the photo confirmation was a lovely touch.', rating: 5, approved: true },
  { name: 'Mohammed Hasan', country: 'Australia', message: 'Ordered a teddy and chocolates for my daughter. She loved them. Will order again.', rating: 5, approved: true },
  { name: 'Shahana Akter', country: 'Canada', message: 'Reliable gift delivery to Dhaka. The kacchi platter was delicious.', rating: 4, approved: true },
  { name: 'Kamrul Islam', country: 'UAE', message: 'Sent Eid gifts to my family in Chittagong. Free delivery was a great bonus.', rating: 5, approved: true },
  { name: 'Nusrat Jahan', country: 'Saudi Arabia', message: 'The personalised photo frame arrived perfectly. Thank you for the careful packaging.', rating: 5, approved: true },
  { name: 'Tanvir Hossain', country: 'Malaysia', message: 'Great selection of sarees. Delivery was on the promised date.', rating: 4, approved: true },
  { name: 'Sumaiya Rahman', country: 'USA', message: 'Used the GIFT coupon and saved on my order. Excellent customer service.', rating: 5, approved: true },
  { name: 'Arif Khan', country: 'UK', message: 'The silk saree quality exceeded my expectations. Beautiful gift wrapping too.', rating: 5, approved: true },
  { name: 'Mim Akhter', country: 'Australia', message: 'Bonoful rosgolla was fresh and tasted like home. Highly recommend.', rating: 5, approved: true },
  { name: 'Sajid Karim', country: 'Canada', message: 'Ordered mobile recharge for my father. Quick and hassle-free.', rating: 5, approved: true },
  { name: 'Lamia Chowdhury', country: 'USA', message: 'The cartoon cake for my son\'s birthday was a hit. Will definitely order again next year.', rating: 5, approved: true },
  { name: 'Anonymous Customer', country: 'Bangladesh', message: 'Pending review — message withheld for moderation.', rating: 4, approved: false },
  { name: 'New Customer', country: 'Bangladesh', message: 'Pending review — awaiting approval.', rating: 5, approved: false },
]

// ---------------------------------------------------------------------------
// CMS pages (EN + BN for each slug)
// ---------------------------------------------------------------------------
const cmsPages: { slug: string; en: { title: string; body: string }; bn: { title: string; body: string } }[] = [
  {
    slug: 'about-us',
    en: {
      title: 'About Us',
      body: '<p>UpoharBd is a Bangladesh-based gift delivery service connecting the Bangladeshi diaspora with their loved ones back home. Since 2017 we have delivered cakes, flowers, food, and gifts across Dhaka, Chittagong, and Sylhet.</p><p>Every delivery is hand-checked by our local team. We work with renowned bakeries such as Coopers, Mr. Baker, Well Food, and Kings, and partner with top flower suppliers and confectioners across the country.</p><p>Our promise: fresh products, on-time delivery, and a photo confirmation so you know your gift reached the right hands.</p>',
    },
    bn: {
      title: 'আমাদের সম্পর্কে',
      body: '<p>উপহারবিডি একটি বাংলাদেশ-ভিত্তিক উপহার ডেলিভারি পরিষেবা যা প্রবাসী বাংলাদেশিদের তাদের প্রিয়জনের সাথে যুক্ত করে। ২০১৭ সাল থেকে আমরা ঢাকা, চট্টগ্রাম এবং সিলেট জুড়ে কেক, ফুল, খাবার ও উপহার পৌঁছে দিচ্ছি।</p><p>প্রতিটি ডেলিভারি আমাদের স্থানীয় দলের দ্বারা যাচাই করা হয়। আমরা কুপার্স, মিস্টার বেকার, ওয়েল ফুড, কিংস এর মতো খ্যাতনামা বেকারির সাথে কাজ করি।</p><p>আমাদের প্রতিশ্রুতি: তাজা পণ্য, সময়মতো ডেলিভারি এবং একটি ফটো নিশ্চিতকরণ।</p>',
    },
  },
  {
    slug: 'how-to-order-gift',
    en: {
      title: 'How to Order a Gift',
      body: '<p>Ordering a gift on UpoharBd takes only a few minutes. Browse the catalogue by category or use the search bar at the top of the page.</p><p>Open any product page, choose the quantity (and variant for cakes), add an optional message on cake, then click <strong>Add to Basket</strong>. When you are ready, click <strong>Checkout »</strong> from your basket.</p><p>Fill in your invoice information, delivery details (recipient name, address, city, date and time slot), then choose a payment method. You will receive an order number by e-mail that you can use to track your delivery.</p>',
    },
    bn: {
      title: 'উপহার অর্ডার করার নিয়ম',
      body: '<p>উপহারবিডিতে অর্ডার করা মাত্র কয়েক মিনিটের ব্যাপার। বিভাগ অনুসারে ক্যাটালগ ব্রাউজ করুন বা উপরের সার্চ বার ব্যবহার করুন।</p><p>যেকোনো পণ্য পেজ খুলুন, পরিমাণ নির্বাচন করুন, কেকে বার্তা যোগ করুন, তারপর <strong>অ্যাড টু বাস্কেট</strong> ক্লিক করুন। প্রস্তুত হলে <strong>চেকআউট »</strong> ক্লিক করুন।</p><p>আপনার চালান তথ্য, ডেলিভারি তথ্য পূরণ করুন, তারপর পেমেন্ট পদ্ধতি নির্বাচন করুন।</p>',
    },
  },
  {
    slug: 'how-to-pay-for-order',
    en: {
      title: 'How to Pay for Your Order',
      body: '<p>We support multiple payment options for senders in Bangladesh and abroad.</p><p><strong>Online:</strong> SSLCommerz cards (Visa/MasterCard/Amex), bKash, and PayPal. Your card is charged in the order currency using a frozen exchange rate set at order placement.</p><p><strong>Manual:</strong> Bank deposit, Western Union, or personal bKash transfer. Upload a deposit slip or enter the transaction ID on the order page; our admin will verify and mark your payment as PAID.</p><p>All amounts are computed in BDT on the server — we never trust client-sent prices.</p>',
    },
    bn: {
      title: 'অর্ডারের জন্য কীভাবে পে করবেন',
      body: '<p>আমরা দেশে ও বিদেশে প্রেরকদের জন্য একাধিক পেমেন্ট বিকল্প সমর্থন করি।</p><p><strong>অনলাইন:</strong> SSLCommerz কার্ড, বিকাশ, এবং পেপ্যাল।</p><p><strong>ম্যানুয়াল:</strong> ব্যাংক ডিপোজিট, ওয়েস্টার্ন ইউনিয়ন, বা ব্যক্তিগত বিকাশ ট্রান্সফার।</p>',
    },
  },
  {
    slug: 'gift-delivery-how-where-and-fees',
    en: {
      title: 'Gift Delivery - How, Where and Fees',
      body: '<p>We deliver across Bangladesh with a focus on Dhaka, Chittagong, and Sylhet. Same-day delivery is available for orders placed before 2:00 PM local time in Dhaka.</p><p><strong>Dhaka:</strong> Delivery fee is included in the product price (no additional charge).</p><p><strong>Chittagong & Sylhet:</strong> Free gift delivery, no minimum order.</p><p><strong>Other cities:</strong> Contact us for availability and fees. Time slots are 7am-10am, 10am-1pm, 1pm-4pm, 4pm-7pm and 7pm-9pm. Photo confirmation is sent to the sender on every successful delivery.</p>',
    },
    bn: {
      title: 'উপহার ডেলিভারি - কীভাবে, কোথায় এবং ফি',
      body: '<p>আমরা বাংলাদেশ জুড়ে ডেলিভারি দিই, বিশেষত ঢাকা, চট্টগ্রাম ও সিলেট। ঢাকায় বেলা ২টার আগে অর্ডার করলে একই দিনে ডেলিভারি পাওয়া যায়।</p><p><strong>ঢাকা:</strong> ডেলিভারি ফি পণ্যমূল্যের অন্তর্ভুক্ত।</p><p><strong>চট্টগ্রাম ও সিলেট:</strong> বিনামূল্যে ডেলিভারি।</p>',
    },
  },
  {
    slug: 'terms-and-conditions',
    en: {
      title: 'Terms and Conditions',
      body: '<p>By placing an order with UpoharBd you agree to these terms. Prices are listed in Bangladeshi Taka (BDT) and converted to your selected currency at the rate in effect at order placement.</p><p>We reserve the right to substitute equivalent products if a listed item is unavailable, with notification to the sender. Perishable items cannot be returned; defective products will be replaced or refunded at our discretion.</p><p>Personal data is stored in accordance with Bangladesh privacy regulations and is never shared with third parties for marketing.</p>',
    },
    bn: {
      title: 'শর্তাবলী',
      body: '<p>উপহারবিডিতে অর্ডার করার মাধ্যমে আপনি এই শর্তাবলীতে সম্মত হন। মূল্য বাংলাদেশি টাকায় (BDT) নির্ধারিত এবং অর্ডারের সময় হার অনুযায়ী আপনার নির্বাচিত মুদ্রায় রূপান্তরিত হয়।</p><p>তালিকাভুক্ত আইটেম অনুপলব্ধ হলে আমরা সমতুল্য পণ্য প্রতিস্থাপন করতে পারি। দ্রুত নষ্ট হওয়া পণ্য ফেরত দেওয়া যাবে না।</p>',
    },
  },
  {
    slug: 'home-about',
    en: {
      title: 'About Our Service',
      body: '<p>UpoharBd is the trusted gift-delivery partner for Bangladeshis living abroad. From New York to Sydney, our customers rely on us to deliver joy to their families in Dhaka, Chittagong, Sylhet and beyond.</p><p>Our catalogue includes fresh flowers from local florists, cakes from renowned Dhaka bakeries, traditional sweets, hand-picked teddy bears, and personalised gifts that carry your message across the miles.</p><p>Every order comes with free red roses, gift wrapping, a greeting card with your personal message, and a photo confirmation so you can see your loved one\'s smile.</p>',
    },
    bn: {
      title: 'আমাদের পরিষেবা সম্পর্কে',
      body: '<p>প্রবাসে বসবাসরত বাংলাদেশিদের জন্য উপহারবিডি একটি বিশ্বস্ত উপহার ডেলিভারি সঙ্গী।</p><p>আমাদের ক্যাটালগে রয়েছে তাজা ফুল, খ্যাতনামা বেকারির কেক, ঐতিহ্যবাহী মিষ্টি, টেডি বিয়ার, এবং পার্সোনালাইজড উপহার।</p><p>প্রতিটি অর্ডারে ফ্রি লাল গোলাপ, গিফট র‍্যাপিং, গ্রিটিং কার্ড এবং ফটো নিশ্চিতকরণ অন্তর্ভুক্ত।</p>',
    },
  },
  {
    slug: 'faq',
    en: {
      title: 'Frequently Asked Questions',
      body: '<p><strong>Q: How fast can you deliver?</strong><br>A: Same-day delivery in Dhaka for orders placed before 2:00 PM. Next-day for other cities.</p><p><strong>Q: Can I send a custom message?</strong><br>A: Yes — every delivery includes a free greeting card. For cakes, you can also add a short message on the cake itself.</p><p><strong>Q: Which payment methods do you accept?</strong><br>A: SSLCommerz cards, bKash, PayPal, bank deposit, Western Union, and personal bKash transfer with proof upload.</p><p><strong>Q: Do I get a photo of the delivery?</strong><br>A: Yes — every successful delivery includes a photo confirmation e-mailed to the sender.</p>',
    },
    bn: {
      title: 'সাধারণ জিজ্ঞাসা',
      body: '<p><strong>প্র: আপনারা কত দ্রুত ডেলিভারি করেন?</strong><br>উ: ঢাকায় বেলা ২টার আগে অর্ডার করলে একই দিনে, অন্য শহরে পরের দিন।</p><p><strong>প্র: কাস্টম বার্তা পাঠাতে পারব?</strong><br>উ: হ্যাঁ — প্রতিটি ডেলিভারিতে ফ্রি গ্রিটিং কার্ড অন্তর্ভুক্ত।</p><p><strong>প্র: কোন পেমেন্ট পদ্ধতি গ্রহণযোগ্য?</strong><br>উ: SSLCommerz কার্ড, বিকাশ, পেপ্যাল, ব্যাংক ডিপোজিট, ওয়েস্টার্ন ইউনিয়ন।</p>',
    },
  },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log('🧹 Clearing existing data (dependency order)...')
  await db.orderEvent.deleteMany()
  await db.payment.deleteMany()
  await db.delivery.deleteMany()
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.cartItem.deleteMany()
  await db.cart.deleteMany()
  await db.address.deleteMany()
  await db.blockedDate.deleteMany()
  await db.deliverySlotRule.deleteMany()
  await db.relatedProduct.deleteMany()
  await db.productVariant.deleteMany()
  await db.productImage.deleteMany()
  await db.productI18n.deleteMany()
  await db.productCategory.deleteMany()
  await db.product.deleteMany()
  await db.categoryI18n.deleteMany()
  await db.category.deleteMany()
  await db.testimonial.deleteMany()
  await db.banner.deleteMany()
  await db.coupon.deleteMany()
  await db.cmsPage.deleteMany()
  await db.setting.deleteMany()
  await db.currency.deleteMany()
  await db.vendor.deleteMany()
  await db.city.deleteMany()
  await db.user.deleteMany()
  console.log('   ✓ Tables cleared')

  // --- Cities ----------------------------------------------------------------
  console.log('🏙  Seeding cities...')
  const cityBySlug: Record<string, { id: number; slug: string }> = {}
  for (const c of citiesData) {
    const created = await db.city.create({ data: c })
    cityBySlug[created.slug] = created
  }

  // --- Currencies ------------------------------------------------------------
  console.log('💱 Seeding currencies...')
  for (const cur of currenciesData) {
    await db.currency.create({
      data: { ...cur, updatedAt: new Date(), isActive: true },
    })
  }

  // --- Vendors ---------------------------------------------------------------
  console.log('🏪 Seeding vendors...')
  const vendorBySlug: Record<string, { id: number; slug: string }> = {}
  for (const v of vendorsData) {
    const created = await db.vendor.create({ data: { name: v, slug: slugify(v) } })
    vendorBySlug[created.slug] = created
  }

  // --- Categories ------------------------------------------------------------
  console.log('🌳 Seeding category tree...')
  // Map slug -> { id, slug } for product/category linking.
  // Note: nested slugs share namespace inside their parent, so we look up by
  // full parent->child path. For product assignment we keep a flat map keyed
  // by slug where the slug is unique enough (top-level + child slugs are all
  // unique within the seed data).
  const catBySlug: Record<string, { id: number; slug: string }> = {}
  let sortCounter = 1

  async function createCategory(
    def: { name: string; icon?: string; bn: string },
    parentId: number | null,
    cityId: number | null,
    showInSidebar: boolean,
    sortOrder: number,
  ) {
    const slug = slugify(def.name)
    const cat = await db.category.create({
      data: {
        slug,
        parentId,
        cityId,
        icon: def.icon ?? null,
        imageUrl: null,
        showInSidebar,
        sortOrder,
        isActive: true,
        i18n: {
          create: [
            {
              locale: 'en',
              name: def.name,
              description: `${def.name} — browse our curated selection available for delivery across Bangladesh.`,
            },
            {
              locale: 'bn',
              name: def.bn,
              description: `${def.bn} — বাংলাদেশ জুড়ে ডেলিভারির জন্য আমাদের নির্বাচিত সংগ্রহ।`,
            },
          ],
        },
      },
    })
    // Index by slug — top-level (created first) wins over sub-categories
    // that share the same slug (e.g. "Teddy Bear and Soft Toys" is both a
    // top-level category and a child of "Gifts and Toys for Kids" per spec §5).
    if (!catBySlug[slug]) catBySlug[slug] = cat
    return cat
  }

  // Top-level categories from the 42-tree
  for (const def of categoryTree) {
    const top = await createCategory(def, null, null, true, sortCounter++)
    if (def.children) {
      let childSort = 1
      for (const childDef of def.children) {
        await createCategory(childDef, top.id, null, false, childSort++)
      }
    }
  }

  // Chittagong city tree
  const chittagong = cityBySlug['chittagong']
  const chattTop = await db.category.create({
    data: {
      slug: 'chittagong-city-free-gift-delivery',
      parentId: null,
      cityId: chittagong.id,
      icon: 'truck',
      showInSidebar: true,
      sortOrder: sortCounter++,
      isActive: true,
      i18n: {
        create: [
          {
            locale: 'en',
            name: 'Chittagong City - Free Gift Delivery',
            description: 'Free gift delivery across Chittagong City — no minimum order.',
          },
          {
            locale: 'bn',
            name: 'চট্টগ্রাম শহর - বিনামূল্যে উপহার ডেলিভারি',
            description: 'চট্টগ্রাম শহরজুড়ে বিনামূল্যে উপহার ডেলিভারি।',
          },
        ],
      },
    },
  })
  catBySlug['chittagong-city-free-gift-delivery'] = chattTop
  let chittChildSort = 1
  for (const childDef of cityTreeChildren) {
    await createCategory(childDef, chattTop.id, chittagong.id, false, chittChildSort++)
  }

  // Sylhet city tree
  const sylhet = cityBySlug['sylhet']
  const sylhTop = await db.category.create({
    data: {
      slug: 'sylhet-city-free-gift-delivery',
      parentId: null,
      cityId: sylhet.id,
      icon: 'truck',
      showInSidebar: true,
      sortOrder: sortCounter++,
      isActive: true,
      i18n: {
        create: [
          {
            locale: 'en',
            name: 'Sylhet City - Free Gift Delivery',
            description: 'Free gift delivery across Sylhet City — no minimum order.',
          },
          {
            locale: 'bn',
            name: 'সিলেট শহর - বিনামূল্যে উপহার ডেলিভারি',
            description: 'সিলেট শহরজুড়ে বিনামূল্যে উপহার ডেলিভারি।',
          },
        ],
      },
    },
  })
  catBySlug['sylhet-city-free-gift-delivery'] = sylhTop
  let sylhChildSort = 1
  for (const childDef of cityTreeChildren) {
    await createCategory(childDef, sylhTop.id, sylhet.id, false, sylhChildSort++)
  }

  // --- Products --------------------------------------------------------------
  console.log('🎁 Seeding products...')
  const productIds: number[] = [] // for related-products linking
  const teddyProductIds: number[] = []
  const cakeProductIds: number[] = []

  // Image URL helper — cycles through placeholder SVGs per prefix.
  const imageCounts: Record<string, number> = {
    teddy: 3, flower: 1, cake: 3, food: 2, sweets: 2, dress: 1, generic: 1,
  }
  function imagesFor(prefix: string, idx: number): string[] {
    const max = imageCounts[prefix] ?? 1
    const n = (idx % 2) + 1 // 1 or 2 images
    const urls: string[] = []
    for (let i = 0; i < n; i++) {
      const num = ((idx + i) % max) + 1
      urls.push(`/placeholders/products/${prefix}-${pad(num, 2)}.svg`)
    }
    return urls
  }

  // Track slug uniqueness just in case.
  const usedSlugs = new Set<string>()
  const usedSkus = new Set<string>()

  async function createProduct(
    spec: ProductSpec,
    idx: number,
  ): Promise<{ id: number; slug: string; kind: 'teddy' | 'cake' | 'other' }> {
    let slug = slugify(spec.name)
    let slugAttempt = 0
    while (usedSlugs.has(slug)) {
      slugAttempt++
      slug = `${slugify(spec.name)}-${slugAttempt}`
    }
    usedSlugs.add(slug)

    let sku = spec.sku
    let skuAttempt = 0
    while (usedSkus.has(sku)) {
      skuAttempt++
      sku = `${spec.sku}-${skuAttempt}`
    }
    usedSkus.add(sku)

    // Resolve category ids
    const categoryIds: number[] = []
    for (const cs of spec.categorySlugs) {
      const cat = catBySlug[cs]
      if (cat) categoryIds.push(cat.id)
      else console.warn(`   ⚠  Category slug not found: ${cs}`)
    }
    if (categoryIds.length === 0) {
      throw new Error(`No categories resolved for product ${spec.name}`)
    }

    // Vendor
    let vendorId: number | undefined
    if (spec.vendorSlug) {
      const v = vendorBySlug[spec.vendorSlug]
      if (v) vendorId = v.id
    }

    // firstSoldYear/orderCount for ~60% of products
    const hasHistory = maybe(0.6)
    const firstSoldYear = hasHistory ? ri(2017, 2023) : null
    const orderCount = hasHistory ? ri(0, 150) : 0

    const product = await db.product.create({
      data: {
        sku,
        slug,
        type: spec.type ?? 'PHYSICAL',
        priceBdt: spec.priceBdt,
        salePriceBdt: spec.salePriceBdt,
        stockMode: spec.stockMode ?? 'UNLIMITED',
        stockQty: spec.stockQty,
        isCake: spec.isCake ?? false,
        vendorId,
        firstSoldYear,
        orderCount,
        isActive: true,
        i18n: {
          create: [
            {
              locale: 'en',
              name: spec.name,
              shortDescription: spec.enShort,
              description: spec.enDesc,
            },
            {
              locale: 'bn',
              name: spec.bnName,
              shortDescription: spec.bnShort,
            },
          ],
        },
        images: {
          create: imagesFor(spec.imagePrefix, idx).map((url, i) => ({
            url,
            alt: spec.name,
            sortOrder: i,
          })),
        },
        categories: {
          create: categoryIds.map(cid => ({ categoryId: cid })),
        },
      },
    })

    // Cake variants: 1 lb and 2 lb (price + 600)
    if (spec.isCake) {
      await db.productVariant.create({
        data: {
          productId: product.id,
          label: '1 lb',
          sku: `${sku}-V1`,
          priceBdt: spec.priceBdt,
        },
      })
      await db.productVariant.create({
        data: {
          productId: product.id,
          label: '2 lb',
          sku: `${sku}-V2`,
          priceBdt: spec.priceBdt + 600,
        },
      })
    }

    productIds.push(product.id)
    const kind = spec.isCake ? 'cake' : (spec.imagePrefix === 'teddy' ? 'teddy' : 'other')
    if (kind === 'teddy') teddyProductIds.push(product.id)
    if (kind === 'cake') cakeProductIds.push(product.id)

    return { id: product.id, slug: product.slug, kind }
  }

  let pIdx = 0
  // Teddy — at least 22, we ship 25
  for (const [name, bnName] of teddyNames) {
    const price = ri(800, 2500)
    const onSale = maybe(0.2)
    await createProduct({
      name,
      bnName,
      sku: `UB-TED-${pad(pIdx + 1)}`,
      priceBdt: price,
      salePriceBdt: onSale ? Math.round(price * 0.9) : undefined,
      imagePrefix: 'teddy',
      categorySlugs: ['teddy-bear-and-soft-toys'],
      enShort: `${name} — soft, huggable, perfect for any occasion.`,
      enDesc: `Our ${name.toLowerCase()} is made from premium plush fabric with safe embroidered eyes. A wonderful gift for birthdays, anniversaries, or to send a hug across the miles. Comes gift-wrapped with a free greeting card and five red roses on every delivery.`,
      bnShort: `${bnName} — নরম, জড়িয়ে ধরার মতো, যেকোনো উপলক্ষ্যে উপযুক্ত।`,
    }, pIdx++)
  }

  // Fresh Flower and Roses — 10
  for (const [name, bnName] of flowerNames) {
    const price = ri(600, 3000)
    const onSale = maybe(0.2)
    await createProduct({
      name,
      bnName,
      sku: `UB-FLW-${pad(pIdx + 1 - teddyNames.length)}`,
      priceBdt: price,
      salePriceBdt: onSale ? Math.round(price * 0.9) : undefined,
      imagePrefix: 'flower',
      categorySlugs: ['fresh-flower-and-roses'],
      enShort: `${name} — hand-arranged by local florists.`,
      enDesc: `Our ${name.toLowerCase()} is freshly arranged by partner florists in Dhaka and delivered with a free greeting card. Add an optional vase and chocolates to complete the gift.`,
      bnShort: `${bnName} — স্থানীয় ফুলবিক্রেতা দ্বারা সাজানো।`,
    }, pIdx++)
  }

  // Coopers cakes — 12 (isCake true, vendor Coopers, link to parent + child)
  for (let i = 0; i < coopersCakes.length; i++) {
    const c = coopersCakes[i]
    const onSale = maybe(0.2)
    await createProduct({
      name: c.name,
      bnName: c.bn,
      sku: `UB-COP-${pad(i + 1)}`,
      priceBdt: c.price,
      salePriceBdt: onSale ? Math.round(c.price * 0.92) : undefined,
      imagePrefix: 'cake',
      categorySlugs: ['cake-from-coopers', c.child],
      vendorSlug: 'coopers',
      isCake: true,
      enShort: `${c.name} from Coopers Bakery — baked fresh on order.`,
      enDesc: `A signature ${c.name.toLowerCase()} baked fresh by Coopers Bakery, one of Dhaka's most trusted names. Choose 1 lb or 2 lb. Add a personalised message on the cake (max 40 characters) at no extra charge.`,
      bnShort: `${c.bn} — কুপার্স বেকারি থেকে তাজা বেক করা।`,
    }, pIdx++)
  }

  // Well Food cakes — 6
  for (let i = 0; i < wellFoodCakes.length; i++) {
    const [name, bnName, price] = wellFoodCakes[i]
    await createProduct({
      name,
      bnName,
      sku: `UB-WEL-${pad(i + 1)}`,
      priceBdt: price,
      imagePrefix: 'cake',
      categorySlugs: ['cake-from-well-food'],
      vendorSlug: 'well-food',
      isCake: true,
      enShort: `${name} — soft sponge with rich cream.`,
      enDesc: `The ${name.toLowerCase()} from Well Food is a customer favourite — soft sponge layered with rich cream. Available in 1 lb and 2 lb. Free cake message included.`,
      bnShort: `${bnName} — নরম স্পঞ্জ এবং সমৃদ্ধ ক্রিম।`,
    }, pIdx++)
  }

  // Mr. Baker cakes — 6
  for (let i = 0; i < mrBakerCakes.length; i++) {
    const [name, bnName, price] = mrBakerCakes[i]
    const onSale = maybe(0.2)
    await createProduct({
      name,
      bnName,
      sku: `UB-MRB-${pad(i + 1)}`,
      priceBdt: price,
      salePriceBdt: onSale ? Math.round(price * 0.92) : undefined,
      imagePrefix: 'cake',
      categorySlugs: ['cakes-from-mr-baker'],
      vendorSlug: 'mr-baker',
      isCake: true,
      enShort: `${name} from Mr. Baker — premium quality.`,
      enDesc: `Mr. Baker's ${name.toLowerCase()} is crafted with imported chocolate and farm-fresh eggs. Choose 1 lb or 2 lb and add a custom cake message at checkout.`,
      bnShort: `${bnName} — প্রিমিয়াম মানের।`,
    }, pIdx++)
  }

  // Food Court — 12
  for (let i = 0; i < foodCourtItems.length; i++) {
    const f = foodCourtItems[i]
    const onSale = maybe(0.15)
    await createProduct({
      name: f.name,
      bnName: f.bn,
      sku: `UB-FOD-${pad(i + 1)}`,
      priceBdt: f.price,
      salePriceBdt: onSale ? Math.round(f.price * 0.9) : undefined,
      imagePrefix: 'food',
      categorySlugs: ['food-court', f.child],
      enShort: `${f.name} — hot and freshly prepared.`,
      enDesc: `Enjoy ${f.name.toLowerCase()} prepared fresh by our partner kitchens in Dhaka. Delivered hot in insulated packaging. Perfect for sending a meal to family or colleagues.`,
      bnShort: `${f.bn} — গরম ও তাজা প্রস্তুত।`,
    }, pIdx++)
  }

  // Chocolate, Ice Cream & Cookies — 8
  for (let i = 0; i < chocolateItems.length; i++) {
    const [name, bnName, price] = chocolateItems[i]
    const onSale = maybe(0.25)
    await createProduct({
      name,
      bnName,
      sku: `UB-CHC-${pad(i + 1)}`,
      priceBdt: price,
      salePriceBdt: onSale ? Math.round(price * 0.9) : undefined,
      imagePrefix: 'cake',
      categorySlugs: ['chocolate-ice-cream-cookies'],
      enShort: `${name} — a sweet treat for any occasion.`,
      enDesc: `Treat your loved ones to our ${name.toLowerCase()}. Made with imported ingredients and beautifully gift-wrapped. Pairs well with a cake or flowers for a complete surprise.`,
      bnShort: `${bnName} — যেকোনো উপলক্ষ্যে মিষ্টি উপহার।`,
    }, pIdx++)
  }

  // Gifts and Dress for Her — 8
  for (let i = 0; i < herGifts.length; i++) {
    const h = herGifts[i]
    await createProduct({
      name: h.name,
      bnName: h.bn,
      sku: `UB-HER-${pad(i + 1)}`,
      priceBdt: h.price,
      imagePrefix: 'dress',
      categorySlugs: ['gifts-and-dress-for-her', h.child],
      enShort: `${h.name} — an elegant gift for her.`,
      enDesc: `Our ${h.name.toLowerCase()} is handpicked for quality and style. Delivered gift-wrapped with a free greeting card and five red roses. Free delivery in Chittagong and Sylhet.`,
      bnShort: `${h.bn} — তার জন্য একটি মার্জিত উপহার।`,
    }, pIdx++)
  }

  // Gifts and Dress for Him — 6
  for (let i = 0; i < himGifts.length; i++) {
    const h = himGifts[i]
    await createProduct({
      name: h.name,
      bnName: h.bn,
      sku: `UB-HIM-${pad(i + 1)}`,
      priceBdt: h.price,
      imagePrefix: 'dress',
      categorySlugs: ['gifts-and-dress-for-him', h.child],
      enShort: `${h.name} — a thoughtful gift for him.`,
      enDesc: `The ${h.name.toLowerCase()} is a popular pick for birthdays, Eid, and anniversaries. Gift-wrapped with a free greeting card and delivered on your chosen date.`,
      bnShort: `${h.bn} — তার জন্য একটি চিন্তাশীল উপহার।`,
    }, pIdx++)
  }

  // Personalised Gifts — 6 (type PERSONALISED)
  for (let i = 0; i < personalisedGifts.length; i++) {
    const [name, bnName, price] = personalisedGifts[i]
    await createProduct({
      name,
      bnName,
      sku: `UB-PER-${pad(i + 1)}`,
      priceBdt: price,
      imagePrefix: 'generic',
      categorySlugs: ['personalised-gifts'],
      type: 'PERSONALISED',
      enShort: `${name} — add your own photo and message.`,
      enDesc: `Create a one-of-a-kind ${name.toLowerCase()} with your custom photo and message. Upload your image at checkout and we will print and deliver it within 3-5 working days. A memorable keepsake for any occasion.`,
      bnShort: `${bnName} — আপনার নিজের ছবি ও বার্তা যোগ করুন।`,
    }, pIdx++)
  }

  // Online Mobile Recharge — 4 (type DIGITAL, TRACKED stock)
  for (let i = 0; i < mobileRecharge.length; i++) {
    const [name, bnName, price] = mobileRecharge[i]
    await createProduct({
      name,
      bnName,
      sku: `UB-MOB-${pad(i + 1)}`,
      priceBdt: price,
      imagePrefix: 'generic',
      categorySlugs: ['online-mobile-recharge'],
      type: 'DIGITAL',
      stockMode: 'UNLIMITED',
      enShort: `${name} — instant top-up to any Bangladeshi number.`,
      enDesc: `Send an instant mobile recharge to any Bangladeshi mobile number (Grameenphone, Robi, Banglalink, Teletalk). Recipient receives the top-up within minutes. A simple but meaningful gift.`,
      bnShort: `${bnName} — যেকোনো বাংলাদেশি নম্বরে তাৎক্ষণিক টপ-আপ।`,
    }, pIdx++)
  }

  // Sweets — 8
  for (let i = 0; i < sweetsItems.length; i++) {
    const s = sweetsItems[i]
    const onSale = maybe(0.2)
    await createProduct({
      name: s.name,
      bnName: s.bn,
      sku: `UB-SWT-${pad(i + 1)}`,
      priceBdt: s.price,
      salePriceBdt: onSale ? Math.round(s.price * 0.9) : undefined,
      imagePrefix: 'sweets',
      categorySlugs: ['misti-and-sweets', s.child],
      enShort: `${s.name} — fresh from renowned confectioners.`,
      enDesc: `Our ${s.name.toLowerCase()} is sourced fresh from trusted confectioners and delivered in insulated packaging. A traditional Bangladeshi sweet treat that brings joy to any celebration.`,
      bnShort: `${s.bn} — খ্যাতনামা মিষ্টি প্রস্তুতকারক থেকে তাজা।`,
    }, pIdx++)
  }

  // Fruits — 6
  for (let i = 0; i < fruitItems.length; i++) {
    const [name, bnName, price] = fruitItems[i]
    await createProduct({
      name,
      bnName,
      sku: `UB-FRT-${pad(i + 1)}`,
      priceBdt: price,
      imagePrefix: 'generic',
      categorySlugs: ['fresh-fruits-and-juices'],
      enShort: `${name} — farm-fresh and hand-selected.`,
      enDesc: `Our ${name.toLowerCase()} contains seasonal fruits hand-selected from local markets. Beautifully arranged in a wicker basket and delivered fresh. A healthy and thoughtful gift.`,
      bnShort: `${bnName} — খামার-তাজা এবং হাতে নির্বাচিত।`,
    }, pIdx++)
  }

  // Groceries — 6
  for (let i = 0; i < groceriesItems.length; i++) {
    const [name, bnName, price] = groceriesItems[i]
    await createProduct({
      name,
      bnName,
      sku: `UB-GRO-${pad(i + 1)}`,
      priceBdt: price,
      imagePrefix: 'generic',
      categorySlugs: ['groceries-and-bazar'],
      enShort: `${name} — practical family gift.`,
      enDesc: `Our ${name.toLowerCase()} is packed with essentials a Bangladeshi household uses every day. A practical and caring gift for parents and siblings — useful, generous, and always appreciated.`,
      bnShort: `${bnName} — ব্যবহারিক পরিবার উপহার।`,
    }, pIdx++)
  }

  // --- Related products (manual teddy→teddy, cake→cake) ---------------------
  console.log('🔗 Seeding related products...')
  for (let i = 0; i + 1 < teddyProductIds.length; i += 2) {
    await db.relatedProduct.create({
      data: { fromId: teddyProductIds[i], toId: teddyProductIds[i + 1] },
    })
    await db.relatedProduct.create({
      data: { fromId: teddyProductIds[i + 1], toId: teddyProductIds[i] },
    })
  }
  for (let i = 0; i + 1 < cakeProductIds.length; i += 2) {
    await db.relatedProduct.create({
      data: { fromId: cakeProductIds[i], toId: cakeProductIds[i + 1] },
    })
    await db.relatedProduct.create({
      data: { fromId: cakeProductIds[i + 1], toId: cakeProductIds[i] },
    })
  }

  // --- Banners ---------------------------------------------------------------
  console.log('🖼  Seeding banners...')
  for (const b of mosaicBanners) {
    await db.banner.create({
      data: {
        placement: 'HOME_MOSAIC',
        title: b.title,
        imageUrl: b.imageUrl,
        link: b.link,
        payload: b.payload,
        sortOrder: b.sortOrder,
        isActive: true,
      },
    })
  }
  for (let i = 0; i < tileBanners.length; i++) {
    const t = tileBanners[i]
    await db.banner.create({
      data: {
        placement: 'HOME_TILES',
        title: t.title,
        imageUrl: `/placeholders/tiles/tile-${pad(i + 1, 2)}.svg`,
        link: t.link,
        payload: JSON.stringify({ kind: 'tile', label: t.title }),
        sortOrder: i + 1,
        isActive: true,
      },
    })
  }

  // --- Testimonials ----------------------------------------------------------
  console.log('💬 Seeding testimonials...')
  for (const t of testimonialsData) {
    await db.testimonial.create({
      data: {
        name: t.name,
        country: t.country,
        message: t.message,
        rating: t.rating,
        approved: t.approved,
        createdAt: new Date(),
      },
    })
  }

  // --- CMS pages -------------------------------------------------------------
  console.log('📄 Seeding CMS pages...')
  for (const p of cmsPages) {
    await db.cmsPage.create({
      data: {
        slug: p.slug,
        locale: 'en',
        title: p.en.title,
        body: p.en.body,
        metaTitle: p.en.title,
        metaDescription: p.en.title,
      },
    })
    await db.cmsPage.create({
      data: {
        slug: p.slug,
        locale: 'bn',
        title: p.bn.title,
        body: p.bn.body,
        metaTitle: p.bn.title,
        metaDescription: p.bn.title,
      },
    })
  }

  // --- Delivery slot rules ---------------------------------------------------
  console.log('⏰ Seeding delivery slot rules...')
  const dhaka = cityBySlug['dhaka']
  const dhakaSlots = [
    { label: '7am-10am', startTime: '07:00', endTime: '10:00' },
    { label: '10am-1pm', startTime: '10:00', endTime: '13:00' },
    { label: '1pm-4pm', startTime: '13:00', endTime: '16:00' },
    { label: '4pm-7pm', startTime: '16:00', endTime: '19:00' },
    { label: '7pm-9pm', startTime: '19:00', endTime: '21:00' },
  ]
  for (const s of dhakaSlots) {
    await db.deliverySlotRule.create({
      data: { cityId: dhaka.id, label: s.label, startTime: s.startTime, endTime: s.endTime, capacity: 50, isActive: true },
    })
  }
  for (const s of dhakaSlots) {
    await db.deliverySlotRule.create({
      data: { cityId: null, label: s.label, startTime: s.startTime, endTime: s.endTime, capacity: 50, isActive: true },
    })
  }
  const chattSlots = [
    { label: '10am-1pm', startTime: '10:00', endTime: '13:00' },
    { label: '1pm-5pm', startTime: '13:00', endTime: '17:00' },
  ]
  for (const s of chattSlots) {
    await db.deliverySlotRule.create({
      data: { cityId: chittagong.id, label: s.label, startTime: s.startTime, endTime: s.endTime, capacity: 50, isActive: true },
    })
  }

  // --- Coupons ---------------------------------------------------------------
  console.log('🎟  Seeding coupons...')
  const coupons = [
    { code: 'GIFT', kind: 'PERCENT', value: 5, minOrderBdt: 0, appliesTo: 'ALL_PACKAGES' },
    { code: 'SUMMER', kind: 'PERCENT', value: 10, minOrderBdt: null, appliesTo: 'ALL_PACKAGES' },
    { code: 'WELCOME', kind: 'PERCENT', value: 5, minOrderBdt: null, appliesTo: 'ALL_PACKAGES' },
    { code: 'BD50', kind: 'FIXED', value: 50, minOrderBdt: 500, appliesTo: 'ALL_PACKAGES' },
  ]
  for (const c of coupons) {
    await db.coupon.create({
      data: {
        code: c.code,
        kind: c.kind,
        value: c.value,
        minOrderBdt: c.minOrderBdt,
        appliesTo: JSON.stringify(c.appliesTo),
        isActive: true,
        usedCount: 0,
      },
    })
  }

  // --- Admin user ------------------------------------------------------------
  console.log('👤 Seeding admin user...')
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const passwordHash = await bcrypt.hash(adminPassword, 12)
  await db.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      title: 'Mr',
      firstName: 'Site',
      lastName: 'Admin',
      phone1: '+880 1700-000000',
      role: 'ADMIN',
    },
  })

  // --- Settings --------------------------------------------------------------
  console.log('⚙️  Seeding settings...')
  const settings: { key: string; value: unknown }[] = [
    { key: 'site.brand', value: 'UpoharBd' },
    { key: 'site.phone', value: '+880 1700-000000' },
    { key: 'site.email', value: 'support@upoharbd.example' },
    { key: 'site.tagline', value: 'Gift Delivery in Bangladesh' },
    { key: 'site.legalName', value: 'Upohar Bangladesh' },
  ]
  for (const s of settings) {
    await db.setting.create({
      data: { key: s.key, value: JSON.stringify(s.value) },
    })
  }

  // --- Counts ----------------------------------------------------------------
  const counts = {
    cities: await db.city.count(),
    currencies: await db.currency.count(),
    vendors: await db.vendor.count(),
    categories: await db.category.count(),
    categoryI18n: await db.categoryI18n.count(),
    products: await db.product.count(),
    productI18n: await db.productI18n.count(),
    productImages: await db.productImage.count(),
    productVariants: await db.productVariant.count(),
    productCategories: await db.productCategory.count(),
    relatedProducts: await db.relatedProduct.count(),
    banners: await db.banner.count(),
    testimonials: await db.testimonial.count(),
    cmsPages: await db.cmsPage.count(),
    deliverySlotRules: await db.deliverySlotRule.count(),
    coupons: await db.coupon.count(),
    users: await db.user.count(),
    settings: await db.setting.count(),
  }

  console.log('\n✅ Seed complete!')
  console.log('Counts:')
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k.padEnd(20)} ${v}`)
  }
}

main()
  .catch(async (err) => {
    console.error('❌ Seed failed:', err)
    await db.$disconnect()
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
