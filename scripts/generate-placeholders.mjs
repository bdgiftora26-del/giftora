// Placeholder SVG generator for UpoharBd clone.
// Generates all SVG assets under /public/placeholders/.
// Run: node scripts/generate-placeholders.mjs

import { writeFileSync } from 'node:fs';

const ROOT = '/home/z/my-project/public/placeholders';
const XML = `<?xml version="1.0" encoding="UTF-8"?>\n`;

// ---- Palette ------------------------------------------------------------
const BRAND = {
  green:  '#4a9c2e',
  red:    '#d6443a',
  orange: '#f08a24',
  blue:   '#2b6fb0',
  teal:   '#2fa6a0',
  lime:   '#9ec93f',
  pink:   '#f6c6d4',
};
// Pastel backgrounds (rotate across variants)
const PASTELS = ['#fde2e4', '#e0f5e9', '#fff4e0', '#e0eef9', '#e0f5f4', '#f1f7e0', '#fce4ec'];

// ---- Helpers ------------------------------------------------------------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const wrap = (inner, attrs) => `${XML}<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${inner}</svg>`;

// ---- Icon definitions (24x24, use currentColor) -------------------------
// Each value is inner SVG content for a <symbol viewBox="0 0 24 24">.
const ICONS = {
  truck: `
<path d="M3 6h11v9H3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M14 9h4l3 3v3h-7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
<circle cx="7" cy="18" r="1.6" fill="currentColor"/>
<circle cx="17" cy="18" r="1.6" fill="currentColor"/>`,

  gift: `
<rect x="3" y="9" width="18" height="12" fill="none" stroke="currentColor" stroke-width="1.5" rx="1"/>
<rect x="2.5" y="6" width="19" height="3.5" fill="currentColor" rx="1"/>
<line x1="12" y1="6" x2="12" y2="21" stroke="currentColor" stroke-width="1.5"/>
<path d="M12 6 C12 4 10 2.5 8 3 C6 3.5 7 6 12 6 M12 6 C12 4 14 2.5 16 3 C18 3.5 17 6 12 6" fill="none" stroke="currentColor" stroke-width="1.3"/>`,

  people: `
<circle cx="9" cy="8" r="3" fill="currentColor"/>
<path d="M3 20 c0-4 3-6 6-6 s6 2 6 6 z" fill="currentColor"/>
<circle cx="17" cy="9" r="2.4" fill="currentColor" opacity="0.7"/>
<path d="M14.5 20 c0-3 2-5 5-5 s3 0.5 3 0.5 l0 4.5 z" fill="currentColor" opacity="0.7"/>`,

  flower: `
<circle cx="12" cy="12" r="2.4" fill="currentColor"/>
<g fill="currentColor">
  <circle cx="12" cy="5.5" r="2.4"/>
  <circle cx="17.5" cy="9" r="2.4"/>
  <circle cx="15.5" cy="16.5" r="2.4"/>
  <circle cx="8.5" cy="16.5" r="2.4"/>
  <circle cx="6.5" cy="9" r="2.4"/>
</g>`,

  fruit: `
<path d="M12 7 C9 5.5 4.5 6.5 4.5 11 C4.5 16 8 20 12 18 C16 20 19.5 16 19.5 11 C19.5 6.5 15 5.5 12 7 Z" fill="currentColor"/>
<path d="M12 7 C12 5 13.2 3.2 15 3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`,

  cart: `
<path d="M3 4h2l2.2 11.5h11l2-8H7.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="9" cy="19" r="1.5" fill="currentColor"/>
<circle cx="17" cy="19" r="1.5" fill="currentColor"/>`,

  chocolate: `
<rect x="5" y="3" width="14" height="18" fill="none" stroke="currentColor" stroke-width="1.5" rx="1.5"/>
<line x1="5" y1="9" x2="19" y2="9" stroke="currentColor" stroke-width="1.3"/>
<line x1="5" y1="15" x2="19" y2="15" stroke="currentColor" stroke-width="1.3"/>
<line x1="9.7" y1="3" x2="9.7" y2="9" stroke="currentColor" stroke-width="1.3"/>
<line x1="14.3" y1="3" x2="14.3" y2="9" stroke="currentColor" stroke-width="1.3"/>
<line x1="7.4" y1="9" x2="7.4" y2="15" stroke="currentColor" stroke-width="1.3"/>
<line x1="12" y1="9" x2="12" y2="15" stroke="currentColor" stroke-width="1.3"/>
<line x1="16.6" y1="9" x2="16.6" y2="15" stroke="currentColor" stroke-width="1.3"/>`,

  teddy: `
<circle cx="12" cy="13.5" r="6" fill="currentColor"/>
<circle cx="6.5" cy="7" r="2.6" fill="currentColor"/>
<circle cx="17.5" cy="7" r="2.6" fill="currentColor"/>
<circle cx="12" cy="13.5" r="2.5" fill="#fff" opacity="0.85"/>
<circle cx="10" cy="12.5" r="0.8" fill="currentColor"/>
<circle cx="14" cy="12.5" r="0.8" fill="currentColor"/>
<circle cx="12" cy="14.5" r="0.7" fill="currentColor"/>`,

  heart: `
<path d="M12 21 C12 21 3.5 14.5 3.5 8.5 C3.5 5.5 5.7 3.5 8.5 3.5 C10.3 3.5 11.5 4.5 12 6 C12.5 4.5 13.7 3.5 15.5 3.5 C18.3 3.5 20.5 5.5 20.5 8.5 C20.5 14.5 12 21 12 21 Z" fill="currentColor"/>`,

  cake: `
<rect x="3" y="14" width="18" height="6" fill="currentColor" rx="1"/>
<rect x="5" y="11" width="14" height="3" fill="currentColor" opacity="0.75"/>
<rect x="7" y="8" width="10" height="3" fill="currentColor" opacity="0.55"/>
<rect x="11.3" y="3.5" width="1.4" height="4.5" fill="currentColor"/>
<circle cx="12" cy="3" r="1" fill="currentColor"/>`,

  'cake-coopers': `
<rect x="3" y="14" width="18" height="6" fill="currentColor" rx="1"/>
<rect x="5" y="11" width="14" height="3" fill="currentColor" opacity="0.7"/>
<rect x="7" y="8" width="10" height="3" fill="currentColor" opacity="0.5"/>
<circle cx="12" cy="4.5" r="1.4" fill="currentColor"/>
<path d="M11 6 h2 v2 h-2 z" fill="currentColor"/>`,

  'cake-wellfood': `
<rect x="4" y="15" width="16" height="5" fill="currentColor"/>
<rect x="7" y="11" width="10" height="4" fill="currentColor" opacity="0.8"/>
<rect x="9.5" y="7" width="5" height="4" fill="currentColor" opacity="0.6"/>
<line x1="12" y1="4" x2="12" y2="7" stroke="currentColor" stroke-width="1.2"/>
<circle cx="12" cy="3.5" r="0.8" fill="currentColor"/>`,

  'cake-mrbaker': `
<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="9" cy="10" r="1" fill="currentColor"/>
<circle cx="15" cy="11" r="1" fill="currentColor"/>
<circle cx="11" cy="15" r="1" fill="currentColor"/>
<circle cx="14.5" cy="14.5" r="1" fill="currentColor"/>
<circle cx="7.5" cy="13" r="0.8" fill="currentColor"/>`,

  'cake-kings': `
<rect x="4" y="13" width="16" height="7" fill="currentColor"/>
<path d="M6 8 L8.5 10.5 L12 6 L15.5 10.5 L18 8 L18 13 L6 13 Z" fill="currentColor"/>
<circle cx="12" cy="5.5" r="0.8" fill="currentColor"/>`,

  'cake-shumis': `
<path d="M5 12 L7 20 L17 20 L19 12 Z" fill="currentColor"/>
<path d="M5 12 C5 8 8 6 12 6 C16 6 19 8 19 12 Z" fill="currentColor" opacity="0.7"/>
<circle cx="12" cy="5" r="1" fill="currentColor"/>`,

  'cake-puro': `
<rect x="3" y="11" width="18" height="9" fill="currentColor" rx="1"/>
<rect x="6.5" y="8" width="3" height="3" fill="currentColor" opacity="0.7"/>
<rect x="14.5" y="8" width="3" height="3" fill="currentColor" opacity="0.7"/>
<line x1="8" y1="5" x2="8" y2="8" stroke="currentColor" stroke-width="1"/>
<line x1="16" y1="5" x2="16" y2="8" stroke="currentColor" stroke-width="1"/>
<circle cx="8" cy="4" r="0.8" fill="currentColor"/>
<circle cx="16" cy="4" r="0.8" fill="currentColor"/>`,

  'cake-bread': `
<ellipse cx="12" cy="11" rx="8" ry="4.5" fill="currentColor"/>
<rect x="4" y="11" width="16" height="7" fill="currentColor" rx="1"/>
<line x1="7" y1="13.5" x2="9" y2="15" stroke="#fff" stroke-width="0.7" opacity="0.5"/>
<line x1="11" y1="13" x2="13" y2="14.5" stroke="#fff" stroke-width="0.7" opacity="0.5"/>
<line x1="14" y1="13.5" x2="16" y2="15" stroke="#fff" stroke-width="0.7" opacity="0.5"/>`,

  food: `
<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="12" cy="12" r="5.5" fill="currentColor" opacity="0.5"/>
<circle cx="9.5" cy="11" r="1.3" fill="currentColor"/>
<circle cx="14" cy="13" r="1.3" fill="currentColor"/>
<circle cx="11" cy="14" r="1" fill="currentColor"/>`,

  sweets: `
<rect x="3" y="6" width="18" height="14" fill="none" stroke="currentColor" stroke-width="1.5" rx="1.5"/>
<rect x="3" y="6" width="18" height="3.5" fill="currentColor"/>
<circle cx="8" cy="14" r="2" fill="currentColor" opacity="0.8"/>
<circle cx="12" cy="14" r="2" fill="currentColor"/>
<circle cx="16" cy="14" r="2" fill="currentColor" opacity="0.8"/>
<circle cx="10" cy="18" r="2" fill="currentColor" opacity="0.6"/>
<circle cx="14" cy="18" r="2" fill="currentColor" opacity="0.6"/>`,

  dress: `
<path d="M9.5 3 L14.5 3 L16.5 6 L21 8 L19 12.5 L17 10.5 L17 21 L7 21 L7 10.5 L5 12.5 L3 8 L7.5 6 Z" fill="currentColor"/>`,

  eid: `
<path d="M16.5 4 A8 8 0 1 0 16.5 20 A6.2 6.2 0 1 1 16.5 4 Z" fill="currentColor"/>`,

  him: `
<path d="M10 3 L14 3 L16.2 6.5 L14 8.5 L13.2 21 L10.8 21 L10 8.5 L7.8 6.5 Z" fill="currentColor"/>`,

  kids: `
<ellipse cx="12" cy="9" rx="5" ry="6" fill="currentColor"/>
<path d="M11 15 L11.5 18 L12.5 18 L13 15 Z" fill="currentColor"/>
<path d="M12 18 Q10 21 11 22 M12 18 Q14 21 13 22" fill="none" stroke="currentColor" stroke-width="1"/>`,

  mobile: `
<rect x="6" y="2" width="12" height="20" fill="none" stroke="currentColor" stroke-width="1.5" rx="2.5"/>
<line x1="10" y1="5" x2="14" y2="5" stroke="currentColor" stroke-width="1.2"/>
<circle cx="12" cy="19" r="1" fill="currentColor"/>`,

  pet: `
<ellipse cx="12" cy="15.5" rx="3.6" ry="3.2" fill="currentColor"/>
<circle cx="6.5" cy="10.5" r="2" fill="currentColor"/>
<circle cx="12" cy="8.5" r="2" fill="currentColor"/>
<circle cx="17.5" cy="10.5" r="2" fill="currentColor"/>`,

  wedding: `
<circle cx="9" cy="13" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="15" cy="13" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M9 4 L9 7 M7.5 5.5 L10.5 5.5" stroke="currentColor" stroke-width="1.2"/>`,

  hamper: `
<path d="M4 10 L20 10 L18 21 L6 21 Z" fill="currentColor"/>
<rect x="4" y="8" width="16" height="2.5" fill="currentColor"/>
<path d="M8 8 C8 4 16 4 16 8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<line x1="12" y1="10" x2="12" y2="21" stroke="#fff" stroke-width="0.8" opacity="0.4"/>`,

  baby: `
<rect x="8" y="6" width="8" height="14" fill="currentColor" rx="1.5"/>
<rect x="9.5" y="3" width="5" height="3" fill="currentColor" rx="1"/>
<line x1="8" y1="10" x2="16" y2="10" stroke="#fff" stroke-width="0.9" opacity="0.6"/>
<line x1="8" y1="14" x2="16" y2="14" stroke="#fff" stroke-width="0.9" opacity="0.6"/>`,

  decor: `
<path d="M9 3 L15 3 L14 7.5 L16.5 18 C16.8 20 14.5 21 12 21 C9.5 21 7.2 20 7.5 18 L10 7.5 Z" fill="currentColor"/>`,

  handicraft: `
<path d="M4 10 L20 10 L18 20 L6 20 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
<line x1="8.5" y1="10" x2="8.5" y2="20" stroke="currentColor" stroke-width="0.9"/>
<line x1="12" y1="10" x2="12" y2="20" stroke="currentColor" stroke-width="0.9"/>
<line x1="15.5" y1="10" x2="15.5" y2="20" stroke="currentColor" stroke-width="0.9"/>
<path d="M4 10 C4 8 20 8 20 10" fill="none" stroke="currentColor" stroke-width="1.5"/>`,

  card: `
<rect x="4" y="5" width="16" height="14" fill="none" stroke="currentColor" stroke-width="1.5" rx="1"/>
<path d="M8 9 L16 9 M8 12 L16 12 M8 15 L12 15" stroke="currentColor" stroke-width="1"/>
<rect x="13" y="3" width="6" height="5" fill="currentColor" opacity="0.5"/>`,

  music: `
<circle cx="7" cy="17.5" r="2.6" fill="currentColor"/>
<circle cx="17" cy="15.5" r="2.6" fill="currentColor"/>
<rect x="9.2" y="6" width="1.8" height="11.5" fill="currentColor"/>
<rect x="19.2" y="4" width="1.8" height="11.5" fill="currentColor"/>
<path d="M9.2 6 L21 4 L21 7 L9.2 9 Z" fill="currentColor"/>`,

  corporate: `
<rect x="3" y="8" width="18" height="12" fill="currentColor" rx="1.5"/>
<rect x="9" y="5" width="6" height="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="3" y="12.5" width="18" height="2" fill="#fff" opacity="0.3"/>
<rect x="10.5" y="12" width="3" height="2.5" fill="#fff" opacity="0.5"/>`,

  puja: `
<path d="M3 14 C3 11 7 9.5 12 9.5 C17 9.5 21 11 21 14 L21 16.5 L3 16.5 Z" fill="currentColor"/>
<ellipse cx="12" cy="14" rx="3" ry="1" fill="#fff" opacity="0.4"/>
<path d="M12 3 C10 6 11 8.5 12 8.5 C13 8.5 14 6 12 3 Z" fill="${BRAND.orange}"/>`,

  friendship: `
<path d="M3.5 12.5 L7 9 L12 11 L17 9 L20.5 12.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M12 20 C12 20 5.5 15 5.5 10.5 C5.5 8 7.2 6.2 9.2 6.8 C10.7 7.2 11.6 8.3 12 9 C12.4 8.3 13.3 7.2 14.8 6.8 C16.8 6.2 18.5 8 18.5 10.5 C18.5 15 12 20 12 20 Z" fill="currentColor"/>`,

  newyear: `
<circle cx="12" cy="13" r="7.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
<line x1="12" y1="13" x2="12" y2="8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
<line x1="12" y1="13" x2="15.5" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
<rect x="10.5" y="3" width="3" height="2" fill="currentColor"/>`,

  valentine: `
<path d="M12 18.5 C12 18.5 5 14 5 9.5 C5 6.8 7 5 9 5.5 C10.6 6 12 7.5 12 8.5 C12 7.5 13.4 6 15 5.5 C17 5 19 6.8 19 9.5 C19 14 12 18.5 12 18.5 Z" fill="currentColor"/>
<line x1="3" y1="20" x2="21" y2="3.5" stroke="currentColor" stroke-width="1.2"/>
<path d="M18 3 L21 3 L21 6" fill="none" stroke="currentColor" stroke-width="1.2"/>`,

  ramadan: `
<path d="M16.5 4 A8 8 0 1 0 16.5 20 A6.2 6.2 0 1 1 16.5 4 Z" fill="currentColor"/>
<path d="M17.5 8 L18 9.5 L19.5 10 L18 10.5 L17.5 12 L17 10.5 L15.5 10 L17 9.5 Z" fill="currentColor"/>`,

  boishakh: `
<circle cx="12" cy="12" r="5" fill="currentColor"/>
<g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
  <line x1="12" y1="2.5" x2="12" y2="5"/>
  <line x1="12" y1="19" x2="12" y2="21.5"/>
  <line x1="2.5" y1="12" x2="5" y2="12"/>
  <line x1="19" y1="12" x2="21.5" y2="12"/>
  <line x1="5.2" y1="5.2" x2="6.9" y2="6.9"/>
  <line x1="17.1" y1="17.1" x2="18.8" y2="18.8"/>
  <line x1="18.8" y1="5.2" x2="17.1" y2="6.9"/>
  <line x1="6.9" y1="17.1" x2="5.2" y2="18.8"/>
</g>`,

  father: `
<path d="M3 12.5 C5 10.5 8 10.5 9 11.5 C10 12.5 11 13.5 12 13.5 C13 13.5 14 12.5 15 11.5 C16 10.5 19 10.5 21 12.5 C19 14.5 17 15.5 15 14.5 C14 14 13 13.5 12 13.5 C11 13.5 10 14 9 14.5 C7 15.5 5 14.5 3 12.5 Z" fill="currentColor"/>`,

  mother: `
<path d="M12 21 C12 21 4.5 14.5 4.5 9 C4.5 6 6.8 4 9.5 4 C11 4 11.8 5 12 6 C12.2 5 13 4 14.5 4 C17.2 4 19.5 6 19.5 9 C19.5 14.5 12 21 12 21 Z" fill="currentColor"/>
<circle cx="12" cy="11" r="1.6" fill="#fff" opacity="0.7"/>`,

  default: `
<rect x="4" y="9" width="16" height="12" fill="currentColor" rx="1.2"/>
<rect x="3" y="6" width="18" height="3.5" fill="currentColor" rx="1"/>
<rect x="11.2" y="6" width="1.6" height="15" fill="#fff" opacity="0.5"/>
<path d="M12 6 C12 4.5 10.5 3.5 9 4 C7.5 4.5 8 6 12 6 M12 6 C12 4.5 13.5 3.5 15 4 C16.5 4.5 16 6 12 6" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
};

// ---- A. Logo ------------------------------------------------------------
function buildLogo() {
  const colors = [BRAND.green, BRAND.red, BRAND.orange, BRAND.blue,
                  BRAND.teal, BRAND.lime, BRAND.pink, BRAND.red,
                  BRAND.orange, BRAND.teal, BRAND.green, BRAND.blue,
                  BRAND.lime, BRAND.pink, BRAND.red, BRAND.orange];
  // 4x4 grid of squares, ribbon on top
  let cells = '';
  const cell = 7, gap = 1, x0 = 8, y0 = 8;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = x0 + c * (cell + gap);
      const y = y0 + r * (cell + gap);
      cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="1.2" fill="${colors[r * 4 + c]}"/>`;
    }
  }
  // ribbon: vertical + horizontal band overlay
  const ribbon = `
    <rect x="${x0 + 1.5*8 - 0.8}" y="${y0 - 2}" width="2.4" height="36" rx="0.6" fill="${BRAND.red}" opacity="0.9"/>
    <rect x="${x0 - 2}" y="${y0 + 1.5*8 - 0.8}" width="36" height="2.4" rx="0.6" fill="${BRAND.red}" opacity="0.9"/>
    <path d="M${x0 + 1.5*8} ${y0 - 2} C ${x0 + 1.5*8 - 4} ${y0 - 8}, ${x0 + 1.5*8 - 6} ${y0 - 2}, ${x0 + 1.5*8} ${y0 + 2} C ${x0 + 1.5*8 + 6} ${y0 - 2}, ${x0 + 1.5*8 + 4} ${y0 - 8}, ${x0 + 1.5*8} ${y0 - 2} Z" fill="${BRAND.red}"/>
  `;
  return wrap(cells + ribbon, `width="120" height="40" viewBox="0 0 120 40"`);
}

// ---- B. Icons sprite ----------------------------------------------------
function buildIconsSprite() {
  const symbols = Object.entries(ICONS)
    .map(([key, inner]) =>
      `<symbol id="icon-${key}" viewBox="0 0 24 24">${inner}</symbol>`)
    .join('\n');
  return wrap(`<defs>${symbols}</defs>`, `style="display:none"`);
}

// ---- C. Product placeholders -------------------------------------------
// Each type: { accent, icons: [iconKey or array] }
const PRODUCT_TYPES = {
  teddy:     { accent: BRAND.orange, icon: 'teddy' },
  flower:    { accent: BRAND.red,    icon: 'flower' },
  cake:      { accent: BRAND.pink,   icon: 'cake' },
  food:      { accent: BRAND.orange, icon: 'food' },
  sweets:    { accent: BRAND.red,    icon: 'sweets' },
  dress:     { accent: BRAND.blue,   icon: 'dress' },
  him:       { accent: BRAND.blue,   icon: 'him' },
  kids:      { accent: BRAND.lime,   icon: 'kids' },
  mobile:    { accent: BRAND.blue,   icon: 'mobile' },
  fruit:     { accent: BRAND.red,    icon: 'fruit' },
  grocery:   { accent: BRAND.green,  icon: 'cart' },
  chocolate: { accent: BRAND.orange, icon: 'chocolate' },
  decor:     { accent: BRAND.teal,   icon: 'decor' },
  generic:   { accent: BRAND.green,  icon: 'gift' },
};

function buildProduct(type, variant) {
  const cfg = PRODUCT_TYPES[type];
  const pastel = PASTELS[(variant + Object.keys(PRODUCT_TYPES).indexOf(type)) % PASTELS.length];
  const accent = cfg.accent;
  // 400x400, pastel bg, white rounded scene, icon centered & scaled
  const inner = ICONS[cfg.icon];
  // scale 24 -> 200 (scale=8.3), center 400 -> top-left = (100, 100) for 200x200
  // We translate icon: from 24x24, scale 8 → 192x192, center top-left = (104,104)
  const scale = 8;
  const size = 24 * scale;
  const tl = (400 - size) / 2;
  const scene = `
    <rect width="400" height="400" fill="${pastel}"/>
    <circle cx="200" cy="200" r="160" fill="#ffffff" opacity="0.55"/>
    <circle cx="200" cy="200" r="120" fill="#ffffff" opacity="0.75"/>
    <g color="${accent}" transform="translate(${tl},${tl}) scale(${scale})">${inner}</g>
    <text x="200" y="370" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="600" fill="${accent}" text-anchor="middle" opacity="0.75">${esc(type)}</text>
  `;
  return wrap(scene, `width="400" height="400" viewBox="0 0 400 400"`);
}

// ---- D. Mosaic SVGs -----------------------------------------------------
function buildMosaicRoses() {
  return wrap(`
    <rect width="300" height="200" fill="${PASTELS[0]}"/>
    <g>
      ${[40, 100, 160, 220, 260].map((cx, i) =>
        [60, 140].map((cy, j) => {
          const id = i * 2 + j;
          const hue = [BRAND.red, BRAND.pink, '#b8322a', '#e5716a'][id % 4];
          return `
            <g transform="translate(${cx},${cy})">
              <circle r="14" fill="${hue}"/>
              ${[0,72,144,216,288].map(a => `<ellipse cx="0" cy="-7" rx="4" ry="7" fill="${hue}" transform="rotate(${a})"/>`).join('')}
              <circle r="4" fill="#fff" opacity="0.5"/>
              <rect x="-1" y="14" width="2" height="32" fill="${BRAND.green}"/>
              <path d="M-1 30 Q-10 25 -12 18 Q-6 22 -1 28" fill="${BRAND.green}"/>
              <path d="M1 35 Q10 30 12 23 Q6 27 1 33" fill="${BRAND.green}"/>
            </g>`;
        }).join('')
      ).join('')}
    </g>
  `, `width="300" height="200" viewBox="0 0 300 200"`);
}

function buildMosaicTeddy() {
  return wrap(`
    <rect width="200" height="200" fill="${PASTELS[3]}"/>
    <circle cx="100" cy="100" r="80" fill="#fff" opacity="0.6"/>
    <g transform="translate(100,110)" color="${BRAND.orange}">
      ${scaledIcon(ICONS.teddy, 3, -36, -36)}
    </g>
  `, `width="200" height="200" viewBox="0 0 200 200"`);
}

function buildMosaicBangladeshMap() {
  // rough blob shape, fill green on white
  return wrap(`
    <rect width="200" height="240" fill="#ffffff"/>
    <path d="M70 30 C90 18 120 22 140 35 C160 48 175 70 178 95 C180 120 170 145 158 165 C148 182 130 200 108 205 C85 210 62 200 48 184 C32 165 22 140 24 110 C26 78 40 50 70 30 Z"
          fill="${BRAND.green}" stroke="#3a7d22" stroke-width="2"/>
    <ellipse cx="100" cy="120" rx="6" ry="4" fill="#ffffff" opacity="0.45"/>
    <text x="100" y="225" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" font-weight="700" fill="${BRAND.green}" text-anchor="middle">Bangladesh</text>
  `, `width="200" height="240" viewBox="0 0 200 240"`);
}

function buildMosaicHearts() {
  const hearts = [];
  for (let i = 0; i < 12; i++) {
    const x = 20 + (i % 6) * 32 + ((Math.floor(i / 6)) * 16);
    const y = 30 + Math.floor(i / 6) * 60;
    const s = 0.4 + (i % 3) * 0.08;
    const col = [BRAND.pink, '#e98aa6', BRAND.red][i % 3];
    hearts.push(`<g transform="translate(${x},${y}) scale(${s})">
      <path d="M12 21 C12 21 3.5 14.5 3.5 8.5 C3.5 5.5 5.7 3.5 8.5 3.5 C10.3 3.5 11.5 4.5 12 6 C12.5 4.5 13.7 3.5 15.5 3.5 C18.3 3.5 20.5 5.5 20.5 8.5 C20.5 14.5 12 21 12 21 Z" fill="${col}"/>
    </g>`);
  }
  return wrap(`
    <rect width="200" height="140" fill="${PASTELS[6]}"/>
    ${hearts.join('\n')}
  `, `width="200" height="140" viewBox="0 0 200 140"`);
}

// ---- E. Tile SVGs (40, cycle 12 illustration types) --------------------
const TILE_ILLO_TYPES = ['cake', 'flower', 'teddy', 'food', 'sweets', 'dress',
                          'him', 'kids', 'fruit', 'chocolate', 'gift', 'heart'];

function buildTile(idx) {
  const illoKey = TILE_ILLO_TYPES[idx % TILE_ILLO_TYPES.length];
  const iconKey = illoKey; // icons exist for these
  const accent = [BRAND.red, BRAND.pink, BRAND.orange, BRAND.green, BRAND.blue, BRAND.teal, BRAND.lime][idx % 7];
  const inner = ICONS[iconKey] || ICONS.gift;
  // 200x200, white bg, 1px border inside, centered icon scaled to ~80px
  const scale = 3;
  const size = 24 * scale; // 72
  const tl = (200 - size) / 2;
  return wrap(`
    <rect width="200" height="200" fill="#ffffff"/>
    <rect x="1" y="1" width="198" height="198" fill="none" stroke="#e5e7eb" stroke-width="1" rx="6"/>
    <circle cx="100" cy="92" r="48" fill="${PASTELS[idx % PASTELS.length]}"/>
    <g color="${accent}" transform="translate(${tl},${92 - size/2}) scale(${scale})">${inner}</g>
    <text x="100" y="172" font-family="ui-sans-serif, system-ui, sans-serif" font-size="11" font-weight="600" fill="#6b7280" text-anchor="middle">${esc(illoKey)}</text>
  `, `width="200" height="200" viewBox="0 0 200 200"`);
}

// ---- F. Payments strip --------------------------------------------------
function buildPayments() {
  const methods = ['VISA', 'MasterCard', 'AMEX', 'PayPal', 'bKash', 'Western Union', 'Norton Secured'];
  const W = 600, H = 40;
  const pillW = 78, pillH = 28, gap = (W - methods.length * pillW) / (methods.length + 1);
  let pills = '';
  methods.forEach((m, i) => {
    const x = gap + i * (pillW + gap);
    const y = (H - pillH) / 2;
    const fill = i % 3 === 0 ? '#4a9c2e' : (i % 3 === 1 ? '#6b7280' : '#2b6fb0');
    const fontSize = m.length > 8 ? 8 : (m.length > 5 ? 9 : 11);
    pills += `
      <g>
        <rect x="${x}" y="${y}" width="${pillW}" height="${pillH}" rx="6" fill="${fill}"/>
        <text x="${x + pillW / 2}" y="${y + pillH / 2 + 1}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${esc(m)}</text>
      </g>`;
  });
  return wrap(`<rect width="${W}" height="${H}" fill="#f8fafc"/>${pills}`, `width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`);
}

// ---- G. Blank 1x1 transparent ------------------------------------------
function buildBlank() {
  return wrap('', `width="1" height="1" viewBox="0 0 1 1"`);
}

// ---- H. OG image --------------------------------------------------------
function buildOG() {
  return wrap(`
    <rect width="1200" height="630" fill="${BRAND.green}"/>
    <rect x="0" y="0" width="1200" height="630" fill="url(#og-grad)"/>
    <defs>
      <linearGradient id="og-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${BRAND.green}" stop-opacity="1"/>
        <stop offset="100%" stop-color="#357a1f" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <!-- decorative confetti -->
    <g opacity="0.25">
      <rect x="80" y="80" width="14" height="14" fill="${BRAND.lime}" transform="rotate(20 87 87)"/>
      <rect x="1080" y="120" width="18" height="18" fill="${BRAND.orange}" transform="rotate(45 1089 129)"/>
      <rect x="980" y="500" width="16" height="16" fill="${BRAND.pink}" transform="rotate(15 988 508)"/>
      <rect x="140" y="520" width="12" height="12" fill="#ffffff" transform="rotate(30 146 526)"/>
      <circle cx="1120" cy="380" r="8" fill="${BRAND.lime}"/>
      <circle cx="100" cy="300" r="6" fill="#ffffff"/>
    </g>
    <!-- gift icon -->
    <g transform="translate(160,210)">
      ${logoGrid(0, 0, 12, 1.5)}
    </g>
    <!-- wordmark -->
    <text x="470" y="305" font-family="ui-sans-serif, system-ui, sans-serif" font-size="96" font-weight="800" fill="#ffffff">UpoharBd</text>
    <text x="475" y="365" font-family="ui-sans-serif, system-ui, sans-serif" font-size="34" font-weight="500" fill="#eaf6e2">Gift Delivery in Bangladesh</text>
    <rect x="475" y="400" width="220" height="4" rx="2" fill="${BRAND.lime}"/>
    <text x="475" y="455" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" fill="#dfeecf" opacity="0.9">Cakes · Flowers · Teddies · Hampers · Sweets</text>
  `, `width="1200" height="630" viewBox="0 0 1200 630"`);
}

// 4x4 multicolor grid for the OG gift icon
function logoGrid(x0, y0, cell, gap) {
  const colors = [BRAND.lime, BRAND.pink, '#ffffff', BRAND.orange,
                  BRAND.pink, BRAND.orange, BRAND.lime, '#ffffff',
                  '#ffffff', BRAND.lime, BRAND.pink, BRAND.orange,
                  BRAND.orange, '#ffffff', BRAND.lime, BRAND.pink];
  let s = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = x0 + c * (cell + gap);
      const y = y0 + r * (cell + gap);
      s += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${colors[r * 4 + c]}"/>`;
    }
  }
  // ribbon
  const mid = x0 + 1.5 * (cell + gap) - cell / 2;
  s += `<rect x="${mid - 1}" y="${y0 - 4}" width="2" height="${4 * cell + 3 * gap + 8}" rx="1" fill="#ffffff" opacity="0.9"/>`;
  s += `<rect x="${x0 - 4}" y="${y0 + 1.5 * (cell + gap) - cell / 2 - 1}" width="${4 * cell + 3 * gap + 8}" height="2" rx="1" fill="#ffffff" opacity="0.9"/>`;
  s += `<path d="M${mid} ${y0 - 4} C${mid - 10} ${y0 - 16}, ${mid - 16} ${y0 - 4}, ${mid} ${y0 + 2} C${mid + 16} ${y0 - 4}, ${mid + 10} ${y0 - 16}, ${mid} ${y0 - 4} Z" fill="#ffffff"/>`;
  return s;
}

// Helper: scale an icon's inner content into a group with explicit color
function scaledIcon(inner, scale, x = 0, y = 0) {
  return `<g transform="translate(${x},${y}) scale(${scale})">${inner}</g>`;
}

// ---- Write everything ---------------------------------------------------
function write(path, content) {
  writeFileSync(path, content, 'utf8');
  console.log('wrote', path);
}

import { mkdirSync } from 'node:fs';
mkdirSync(`${ROOT}/products`, { recursive: true });
mkdirSync(`${ROOT}/mosaic`, { recursive: true });
mkdirSync(`${ROOT}/tiles`, { recursive: true });

// A. Logo
write(`${ROOT}/logo.svg`, buildLogo());

// B. Icons sprite
write(`${ROOT}/icons.svg`, buildIconsSprite());

// C. Product placeholders (14 types × 4 variants)
for (const type of Object.keys(PRODUCT_TYPES)) {
  for (let v = 1; v <= 4; v++) {
    write(`${ROOT}/products/${type}-${String(v).padStart(2, '0')}.svg`, buildProduct(type, v - 1));
  }
}

// D. Mosaic
write(`${ROOT}/mosaic/roses.svg`, buildMosaicRoses());
write(`${ROOT}/mosaic/teddy.svg`, buildMosaicTeddy());
write(`${ROOT}/mosaic/bangladesh-map.svg`, buildMosaicBangladeshMap());
write(`${ROOT}/mosaic/hearts.svg`, buildMosaicHearts());

// E. Tiles (40)
for (let i = 1; i <= 40; i++) {
  write(`${ROOT}/tiles/tile-${String(i).padStart(2, '0')}.svg`, buildTile(i - 1));
}

// F. Payments
write(`${ROOT}/payments.svg`, buildPayments());

// G. Blank
write(`${ROOT}/blank.svg`, buildBlank());

// H. OG image
write(`${ROOT}/og-image.svg`, buildOG());

console.log('done');
