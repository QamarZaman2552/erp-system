# 🎨 ERP Light Mode — Color Scheme (Soft & Elegant)

> Design Philosophy: **Soft whites, cool blues, lavender tints** — professional, airy, and easy on the eyes for long working sessions. Every color is purposeful.

---

## 🖼 Design Tokens (CSS Custom Properties)

Paste this in your Angular `styles.scss` or global CSS file:

```scss
:root {
  /* ─── Surfaces ─────────────────────────────── */
  --color-bg-page:         #F0F4FF;   /* Page / app background   */
  --color-bg-card:         #FFFFFF;   /* Cards, panels, modals   */
  --color-bg-sidebar:      #F6F7FA;   /* Sidebar background      */
  --color-bg-input:        #F6F7FA;   /* Input fields            */
  --color-bg-hover:        #EEF1FF;   /* Row hover / focus state */

  /* ─── Primary Brand ────────────────────────── */
  --color-primary:         #4A6CF7;   /* Royal Indigo — buttons, links, active */
  --color-primary-hover:   #3352D0;   /* Primary button hover    */
  --color-primary-light:   #6C8EFB;   /* Soft Periwinkle         */
  --color-primary-tint:    #EEF1FF;   /* Iris Mist — active bg   */
  --color-primary-border:  #B3C1FD;   /* Primary border / ring   */

  /* ─── Text ──────────────────────────────────── */
  --color-text-primary:    #1A1D2E;   /* Headings, labels        */
  --color-text-body:       #4B5268;   /* Slate Dusk — body text  */
  --color-text-muted:      #8B90A7;   /* Cool Lavender — hints   */
  --color-text-disabled:   #C9CBD5;   /* Disabled text           */
  --color-text-on-primary: #FFFFFF;   /* Text on primary buttons */

  /* ─── Borders & Dividers ───────────────────── */
  --color-border:          #E8EAEF;   /* Silver Veil — hairlines */
  --color-border-strong:   #C9CBD5;   /* Emphasized dividers     */
  --color-border-focus:    #4A6CF7;   /* Input focus ring        */

  /* ─── Status: Success ──────────────────────── */
  --color-success:         #16A34A;   /* Jade Green              */
  --color-success-hover:   #15803D;
  --color-success-bg:      #DCFCE7;   /* Mint Foam               */
  --color-success-border:  #BBF7D0;
  --color-success-text:    #15803D;

  /* ─── Status: Warning ──────────────────────── */
  --color-warning:         #F59E0B;   /* Amber Glow              */
  --color-warning-hover:   #D97706;
  --color-warning-bg:      #FEF3C7;   /* Honey Mist              */
  --color-warning-border:  #FDE68A;
  --color-warning-text:    #B45309;

  /* ─── Status: Danger ───────────────────────── */
  --color-danger:          #DC2626;   /* Rose Red                */
  --color-danger-hover:    #B91C1C;
  --color-danger-bg:       #FEE2E2;   /* Blush Mist              */
  --color-danger-border:   #FECACA;
  --color-danger-text:     #B91C1C;

  /* ─── Status: Info ─────────────────────────── */
  --color-info:            #0EA5E9;   /* Sky Blue                */
  --color-info-hover:      #0284C7;
  --color-info-bg:         #E0F2FE;   /* Aqua Breath             */
  --color-info-border:     #BAE6FD;
  --color-info-text:       #0369A1;

  /* ─── Module Accents ───────────────────────── */
  --color-module-hr:       #7C3AED;   /* Violet  — HR & Payroll  */
  --color-module-hr-bg:    #F3E8FF;
  --color-module-attend:   #0D9488;   /* Teal    — Attendance    */
  --color-module-attend-bg:#CCFBF1;
  --color-module-inv:      #EA580C;   /* Tangerine — Inventory   */
  --color-module-inv-bg:   #FFEDD5;
  --color-module-crm:      #DB2777;   /* Fuchsia — CRM           */
  --color-module-crm-bg:   #FCE7F3;
  --color-module-proj:     #2563EB;   /* Cobalt  — Projects      */
  --color-module-proj-bg:  #DBEAFE;
  --color-module-fin:      #059669;   /* Emerald — Finance       */
  --color-module-fin-bg:   #D1FAE5;

  /* ─── Typography ───────────────────────────── */
  --font-sans: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* ─── Sizing ────────────────────────────────── */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
  --radius-pill:9999px;
  --shadow-card: 0 1px 4px rgba(26, 29, 46, 0.06), 0 0 0 0.5px #E8EAEF;
  --shadow-modal:0 8px 32px rgba(26, 29, 46, 0.14);
}
```

---

## 🎨 Color Reference Table

### Primary Palette

| Token Name | Hex | Usage |
|---|---|---|
| Petal Blue | `#F0F4FF` | Page / App background |
| Pure White | `#FFFFFF` | Cards, modals, panels |
| Royal Indigo | `#4A6CF7` | Primary buttons, links, active states |
| Soft Periwinkle | `#6C8EFB` | Primary hover, icons |
| Iris Mist | `#EEF1FF` | Active nav bg, selected row bg |
| Primary Border | `#B3C1FD` | Input rings, focused borders |

### Text Colors

| Token Name | Hex | Usage |
|---|---|---|
| Deep Navy | `#1A1D2E` | Headings, page titles, labels |
| Slate Dusk | `#4B5268` | Body text, descriptions |
| Cool Lavender | `#8B90A7` | Placeholders, hints, metadata |
| Silver Mist | `#C9CBD5` | Disabled state text |
| Ghost White | `#F6F7FA` | Sidebar, input field background |

### Borders & Dividers

| Token Name | Hex | Usage |
|---|---|---|
| Silver Veil | `#E8EAEF` | Default borders, table lines |
| Stone Gray | `#C9CBD5` | Strong dividers, emphasized borders |
| Royal Indigo | `#4A6CF7` | Focus rings on inputs |

### Semantic / Status Colors

| Status | Solid | Background | Text | Border |
|---|---|---|---|---|
| ✅ Success | `#16A34A` | `#DCFCE7` | `#15803D` | `#BBF7D0` |
| ⚠️ Warning | `#F59E0B` | `#FEF3C7` | `#B45309` | `#FDE68A` |
| ❌ Danger | `#DC2626` | `#FEE2E2` | `#B91C1C` | `#FECACA` |
| ℹ️ Info | `#0EA5E9` | `#E0F2FE` | `#0369A1` | `#BAE6FD` |

### Module Accent Colors

| Module | Accent | Background | Usage |
|---|---|---|---|
| 👔 HR & Payroll | `#7C3AED` Violet | `#F3E8FF` | HR pages, payroll cards |
| 🕐 Attendance | `#0D9488` Teal | `#CCFBF1` | Attendance tracker, check-in |
| 📦 Inventory | `#EA580C` Tangerine | `#FFEDD5` | Stock levels, inventory alerts |
| 🤝 CRM | `#DB2777` Fuchsia | `#FCE7F3` | Customer cards, lead pipeline |
| 📋 Projects | `#2563EB` Cobalt | `#DBEAFE` | Project boards, task cards |
| 💰 Finance | `#059669` Emerald | `#D1FAE5` | Revenue, expense, reports |
| 🔐 Auth / Admin | `#4A6CF7` Indigo | `#EEF1FF` | Login, settings, admin panel |
| 🛒 Sales | `#EA580C` Tangerine | `#FFEDD5` | Orders, invoices, deals |

---

## 🏷 Badge / Status Pill Styles

```scss
// Base badge
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 500;
}

.badge-success  { background: #DCFCE7; color: #15803D; }
.badge-warning  { background: #FEF3C7; color: #B45309; }
.badge-danger   { background: #FEE2E2; color: #B91C1C; }
.badge-info     { background: #E0F2FE; color: #0369A1; }
.badge-primary  { background: #EEF1FF; color: #3352D0; }
.badge-purple   { background: #F3E8FF; color: #6D28D9; }
.badge-teal     { background: #CCFBF1; color: #0F766E; }
.badge-orange   { background: #FFEDD5; color: #C2410C; }
.badge-pink     { background: #FCE7F3; color: #BE185D; }
.badge-neutral  { background: #F1F5F9; color: #475569; }
```

---

## 🧱 Component Color Recipes

### Cards
```scss
.erp-card {
  background: var(--color-bg-card);       /* #FFFFFF */
  border: 0.5px solid var(--color-border); /* #E8EAEF */
  border-radius: var(--radius-lg);         /* 14px    */
  box-shadow: var(--shadow-card);
}
```

### Sidebar
```scss
.erp-sidebar {
  background: var(--color-bg-card);        /* #FFFFFF */
  border-right: 0.5px solid var(--color-border);

  .nav-item {
    color: var(--color-text-body);
    border-radius: var(--radius-md);

    &:hover { background: #F6F7FA; }

    &.active {
      background: var(--color-primary-tint); /* #EEF1FF */
      color: var(--color-primary);           /* #4A6CF7 */
      font-weight: 500;
    }
  }
}
```

### Buttons
```scss
.btn-primary {
  background: var(--color-primary);        /* #4A6CF7 */
  color: #fff;
  &:hover { background: var(--color-primary-hover); /* #3352D0 */ }
}

.btn-secondary {
  background: var(--color-primary-tint);   /* #EEF1FF */
  color: var(--color-primary);
  border: 0.5px solid var(--color-primary-border);
}

.btn-danger {
  background: var(--color-danger-bg);      /* #FEE2E2 */
  color: var(--color-danger-text);
  border: 0.5px solid var(--color-danger-border);
}

.btn-success {
  background: var(--color-success-bg);     /* #DCFCE7 */
  color: var(--color-success-text);
  border: 0.5px solid var(--color-success-border);
}
```

### Inputs
```scss
.erp-input {
  background: var(--color-bg-input);       /* #F6F7FA */
  border: 0.5px solid var(--color-border); /* #E8EAEF */
  color: var(--color-text-primary);        /* #1A1D2E */
  border-radius: var(--radius-sm);

  &:focus {
    outline: none;
    border-color: var(--color-border-focus); /* #4A6CF7 */
    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.12);
  }

  &::placeholder { color: var(--color-text-muted); /* #8B90A7 */ }
}
```

### Stat / KPI Cards
```scss
.stat-card {
  border-radius: var(--radius-md);
  padding: 1rem;
  text-align: center;

  .stat-value { font-size: 24px; font-weight: 500; }
  .stat-label { font-size: 12px; margin-top: 4px; }
}

.stat-primary { background: #EEF1FF; .stat-value { color: #4A6CF7; } .stat-label { color: #6C8EFB; } }
.stat-success { background: #DCFCE7; .stat-value { color: #16A34A; } .stat-label { color: #22C55E; } }
.stat-warning { background: #FEF3C7; .stat-value { color: #D97706; } .stat-label { color: #F59E0B; } }
.stat-purple  { background: #F3E8FF; .stat-value { color: #7C3AED; } .stat-label { color: #A855F7; } }
```

### Module Sidebar Accent (Left Border Cards)
```scss
.module-card {
  background: var(--color-bg-card);
  border: 0.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: .9rem;

  &.hr       { border-left: 3px solid #7C3AED; }
  &.attend   { border-left: 3px solid #0D9488; }
  &.inventory{ border-left: 3px solid #EA580C; }
  &.crm      { border-left: 3px solid #DB2777; }
  &.projects { border-left: 3px solid #2563EB; }
  &.finance  { border-left: 3px solid #059669; }
}
```

### Data Table
```scss
.erp-table {
  width: 100%;
  border-collapse: collapse;

  th {
    background: var(--color-bg-sidebar);   /* #F6F7FA */
    color: var(--color-text-muted);         /* #8B90A7 */
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: .06em;
    padding: 10px 14px;
  }

  td {
    padding: 12px 14px;
    color: var(--color-text-body);          /* #4B5268 */
    border-bottom: 0.5px solid var(--color-border);
    font-size: 13px;
  }

  tr:hover td { background: #F6F7FA; }
}
```

---

## 🌈 Primary Color Ramp (Full Spectrum)

| Stop | Hex | Name |
|---|---|---|
| 50 | `#EEF1FF` | Iris Mist |
| 100 | `#D6DEFF` | Periwinkle Pale |
| 200 | `#B3C1FD` | Lavender Blue |
| 300 | `#8FA4FB` | Cornflower |
| 400 | `#6C8EFB` | Soft Periwinkle |
| **500** | **`#4A6CF7`** | **Royal Indigo ← Primary** |
| 600 | `#3352D0` | Deep Indigo |
| 700 | `#1F3AAD` | Oxford Blue |
| 900 | `#0E2487` | Midnight Blue |

## 🩶 Neutral Ramp

| Stop | Hex | Name |
|---|---|---|
| 50 | `#F6F7FA` | Ghost White |
| 100 | `#ECEEF4` | Mist |
| 200 | `#E8EAEF` | Silver Veil |
| 300 | `#C9CBD5` | Fog |
| 400 | `#8B90A7` | Cool Lavender |
| 500 | `#6B7094` | Slate Medium |
| **600** | **`#4B5268`** | **Slate Dusk ← Body text** |
| 700 | `#2E3247` | Dark Slate |
| **900** | **`#1A1D2E`** | **Deep Navy ← Headings** |

---

## 🔤 Typography Scale

```scss
// Font
$font-primary: 'Inter', 'Segoe UI', system-ui, sans-serif;

// Sizes
--text-xs:   11px;   // badges, metadata
--text-sm:   12px;   // table headers, captions
--text-base: 13px;   // table cells, sidebar items
--text-md:   14px;   // body text, descriptions
--text-lg:   16px;   // card headings
--text-xl:   20px;   // section headings
--text-2xl:  24px;   // page headings
--text-3xl:  30px;   // stat numbers

// Weights
--weight-regular: 400;
--weight-medium:  500;
--weight-bold:    600;  // sparingly — only page titles
```

---

## 🗂 Angular SCSS Integration

```scss
// src/styles.scss

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

:root {
  // paste all tokens from above
}

* {
  box-sizing: border-box;
  font-family: var(--font-sans);
}

body {
  background: var(--color-bg-page);
  color: var(--color-text-body);
  margin: 0;
}

// Angular Material theme override (indigo-based)
@use '@angular/material' as mat;
$erp-primary: mat.define-palette(mat.$indigo-palette, 600);
$erp-accent:  mat.define-palette(mat.$blue-palette, A200);
$erp-theme:   mat.define-light-theme((
  color: (primary: $erp-primary, accent: $erp-accent)
));
@include mat.all-component-themes($erp-theme);
```

---

## ✅ Color Usage Checklist

- [ ] Page background → `#F0F4FF` (never pure white for the page)
- [ ] Cards always → `#FFFFFF` with `0.5px solid #E8EAEF` border
- [ ] Primary buttons → `#4A6CF7` with white text
- [ ] Headings → `#1A1D2E` (Deep Navy)
- [ ] Body text → `#4B5268` (Slate Dusk)
- [ ] Muted/placeholder → `#8B90A7` (Cool Lavender)
- [ ] Success badge → `#DCFCE7` bg + `#15803D` text
- [ ] Warning badge → `#FEF3C7` bg + `#B45309` text
- [ ] Danger badge → `#FEE2E2` bg + `#B91C1C` text
- [ ] Each module uses its dedicated accent color
- [ ] Input focus ring → `#4A6CF7` with 12% opacity spread
- [ ] No pure black text — always `#1A1D2E` or `#4B5268`
- [ ] Sidebar active item → `#EEF1FF` bg + `#4A6CF7` text

---

*Color Scheme Version: 1.0 | Mode: Light | Style: Soft & Elegant*
