---
type: "agent_requested"
description: "This is the latest changelogs detail of Tailwind CSS 4. A major update. Use this whenever you write tailwind CSS"
---
# Tailwind CSS 4: Comprehensive Upgrade & Migration Guide

## Overview

Tailwind CSS 4.0 (released January 2025) introduces a **CSS-first configuration model**, a new **Oxide** build engine written in Rust, automatic content detection, and dozens of modern CSS features. The result is builds up to **5× faster**, incremental builds **100× faster**, and dramatically smaller CSS bundles.

> Tailwind 4 requires Safari 16.4+, Chrome 111+, and Firefox 128+. Keep using 3.4 if you support older browsers.

---

## 1 • Installation & Project Setup

### Zero-Config Install
```bash
npm install tailwindcss@latest @tailwindcss/cli
# OR
pnpm add -D tailwindcss @tailwindcss/cli
```

Create your entry CSS and import Tailwind:
```css
/* app.css */
@import "tailwindcss";
```

Build once:
```bash
npx @tailwindcss/cli -i app.css -o dist.css -w
```

### Dedicated Vite Plugin (recommended)
```bash
npm install -D @tailwindcss/vite
```
```js
// vite.config.js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [tailwindcss()] 
})
```

---

## 2 • CSS-First Configuration with `@theme`

JavaScript `tailwind.config.js` is **optional**. All tokens can live in CSS:
```css
@import "tailwindcss";
@theme {
  --font-display: 'Satoshi', sans-serif;
  --breakpoint-3xl: 1920px;
  --color-brand-500: oklch(70% 0.2 250);
}
```

### Namespaces & Overrides
```css
@theme { /* extends default */ }
@theme !-utilities { /* replace utilities scale */ }
```

### Dynamic Utility Values
No need to pre-declare scale steps. Write arbitrary values directly:
```html
<div class="w-103 grid-cols-15 z-42"></div>
```

---

## 3 • Major New Features

| Feature | Benefit |
|--|--|
|**Oxide engine (Rust)**|Full build 5× faster; incremental 100× faster|
|**Lightning CSS**|Built-in autoprefixer & import support\*|
|**Automatic content detection**|No `content` array; Tailwind scans project automatically|
|**Cascade layers**|All core layers (`base`, `components`, `utilities`) mapped to native `@layer`|
|**Container queries**|`@container` utilities out of the box|
|**Modern color palette**|Default palette in **OKLCH** + P3 gamut|
|**3D transforms & expanded gradients**|`rotate-x-*`, radial & conic gradients + interpolation modes|
|**`@starting-style` variant**|Native enter/exit transitions without JS|
|**Composable variants**|Stack unlimited variants (`hover:lg:bg-red-500`) |
|**not-* & `[data-*]` variants**|Style negative/attribute states without plugins|

\*Remove `postcss-import` & `autoprefixer` from your toolchain.

---

## 4 • Deprecated & Renamed Utilities

### Removed
| v3 utility | Replacement |
|--|--|
|`bg-opacity-*`|`bg-black/50` etc.|
|`text-opacity-*`|`text-black/50`|
|`flex-shrink-*`|`shrink-*`|
|`overflow-ellipsis`|`text-ellipsis`|
|`ring-opacity-*`|`ring-black/50`|

### Renamed Scales
| Old | New |
|--|--|
|`shadow-sm`|`shadow-xs`|
|`shadow`|`shadow-sm`|
|`blur-sm`|`blur-xs`|
|`rounded-sm`|`rounded-xs`|
|`ring`|`ring-3` (1 px default) |

Update references or run the **upgrade tool**.

---

## 5 • Upgrade Tool → `@tailwindcss/upgrade`

Run in a new Git branch:
```bash
npx @tailwindcss/upgrade@next
```
Automates:
1. Bumps dependencies & replaces PostCSS plugin
2. Converts JS config → in-CSS `@theme`
3. Renames/rewrites deprecated utilities
4. Scans templates and rewrites class names

Manual follow-ups:
- Replace `ring` with `ring-3`
- Review removed modifiers (`group-hover` still works)
- Convert any custom PostCSS logic to native layers or plugin API

---

## 6 • Plugin & Ecosystem Changes

- **Core Plugins**: use native `@utility` directive instead of `@layer utilities`.
- **Third-party plugins** must export a CSS file or a Lightning CSS transform.
- **daisyUI 5** & **Headless UI** have v4-compatible releases.
- **SvelteKit**, **Next.js 14**, **Nuxt 3.9** all bundle Tailwind 4 scaffolds.

---

## 7 • Best Practices & Patterns

### Theme Tokens via CSS Variables
```css
@theme {
  --radius-s: 2px;
  --radius-m: 6px;
}
.card { border-radius: var(--radius-m); }
```

### Dark Mode via attribute selector
```css
@custom-variant dark (html[data-theme='dark'] &);
```

### Container Queries
```html
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-3"></div>
</div>
```

### Safelisting Utilities
```css
@source inline('prose lg:prose-xl');
```

---

## 8 • Legacy vs Modern — Quick Cheat Sheet

| Area | Tailwind 3 | Tailwind 4 |
|--|--|--|
|Config file |`tailwind.config.js`|Optional. Primary via `@theme`|
|JIT mode |Optional flag|Always on & faster|
|Dependencies |PostCSS, autoprefixer|None (built-in) |
|Content detection |Manual array|Automatic (heuristic) |
|Custom utilities |`@layer utilities`|`@utility` directive |
|Prefix |`prefix` key|`@import "tailwindcss" prefix(tw);`|
|Dark mode |`class`/`media`|`@custom-variant` or native `:has()`|
|Color model |RGB/HSL|OKLCH + P3 |
|Container queries|Plugin|Core |

---

## 9 • Troubleshooting

- **Missing defaults**: Add base layer overrides for borders/placeholders.
- **Broken dark mode**: Recreate variants with `@custom-variant dark (&[data-theme='dark'] *)`.
- **Sass/Less not supported**: Treat Tailwind as the pre-processor; migrate to CSS modules or native layers.

---

## 10 • Conclusion

Tailwind 4 modernizes the entire developer experience:
- **CSS-first workflow** simplifies theming
- **Oxide engine** makes builds lightning fast
- **Automatic content detection** removes boilerplate
- **Modern CSS primitives** unlock container queries, cascade layers, and vibrant OKLCH colors

Migration is straightforward with the official upgrade tool. The payoff is faster builds, cleaner configs, and cutting-edge CSS features ready out of the box.