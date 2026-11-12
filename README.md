<div align="center">

# 📊 Chart Caption Studio

**Make the numbers tell a clearer story.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-777777?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue chart and caption workshop with a typed generic table, strict CSV exchange, signed plots, and standalone SVG/JSON exports._

</div>

---

## ✨ Highlights

- **A useful little dataset:** Edit 1–12 labeled values with up to two decimal places, including negatives.
- **Typed table slots:** A generic Vue SFC derives column keys and cell-slot values from the actual row type.
- **Two clear views:** Switch between bars and an ordered line chart without moving the reserved preview frame.
- **Add the context:** Edit a title, unit, and caption; the accessible SVG description includes every value.
- **Strict CSV exchange:** Import quoted cells, commas, escaped quotes, multiline labels, BOM, and CRLF without a CSV dependency.
- **Portable artwork:** Export a self-contained SVG, data CSV, or editable chart JSON with CT provenance.
- **Local drafts:** Keep the last valid chart when an edit fails; confirm point removal and sample restoration.

## 🧱 Project Structure

```text
public/
├── favicon.svg                         # Original project emblem
├── og.svg                              # Original social artwork
├── font-licenses.txt                   # Font copyright and OFL licenses
├── sample-data.csv                     # Importable data-only sample
└── sample-workspace.json               # Complete importable workspace
src/
├── components/
│   ├── ChartPreview.vue
│   ├── DataTable.vue
│   ├── AppDialog.vue                   # Native Teleport modal and focus lifecycle
│   ├── AppIcon.vue                     # Original inline SVG icons
│   ├── DataExchange.vue                # Validated workspace import dialog
│   └── StudioHeader.vue                # Workspace branding and actions
├── domain/
│   ├── chart.ts                       # Pure validation, calculations, and exports
│   └── validation.ts                   # Strict unknown-input guards
├── services/
│   ├── draft.ts                        # Validated device-local persistence
│   └── files.ts                        # Downloads and deterministic identities
├── App.vue                             # Workspace and editor state
├── base.css                            # Tailwind, local fonts, and control defaults
├── style.css                           # Project theme tokens
└── main.ts                             # Vue application entry
tests/
├── *.test.ts                           # Native domain/composable/export tests
└── e2e/                                # Production browser workflows
```

Root files include Vite, TypeScript, Playwright, and Prettier configuration, an npm lockfile, the MIT license, and explicit `vercel.json`. The official scaffold’s default artwork and empty `src/assets` directory are removed. The shared generic development container stays unchanged.

## 🛠 Tech Stack

| Tool                          | Role                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| Vue 3.5                       | Typed SFCs, component contracts, reactive state, and lifecycle management   |
| TypeScript 6                  | Checked domain structures and component/composable inputs                   |
| Vite 8                        | Development server and static production bundles                            |
| Tailwind CSS 4                | Vite plugin, theme tokens, template utilities, and responsive/state styling |
| DM Sans + Bricolage Grotesque | Locally bundled Latin variable fonts                                        |
| Node.js 24+                   | Local CLI tools and native TypeScript tests                                 |
| Playwright                    | Chromium workflows against the production build                             |

The app requires no account, backend, remote data source, or extra UI library. All dependencies and CLI tools are installed locally inside this independent project.

## 🎨 Tailwind Styling

The Vite config enables `@tailwindcss/vite`. `base.css` imports Tailwind, defines font tokens, and uses `@apply` for small native control defaults. `style.css` defines project colors through `@theme`. Actual application templates use Tailwind utilities for grid/flex layouts, spacing, typography, borders, colors, responsive behavior, focus, and visible states.

`data-ui`, `data-project`, and domain identity attributes are explicit browser hooks. There are no orphan semantic styling classes. Reserved preview/list containers and internal overflow keep neighboring panels stable when modes, selected details, or results change. Domain-driven chart/progress/contribution dimensions use inline styles; self-contained exported documents carry their own styles where needed. Reduced-motion preferences shorten transitions.

Two Fontsource variable font files are bundled as hashed local assets. Their copyright and OFL text are in [font-licenses.txt](./public/font-licenses.txt). Favicon/social artwork and SVG interface icons are original project assets.

## 📦 Included Demo Data

The original **A little library, a growing audience** sample contains six January–June visit counts, a visits unit, and a caption describing the fictional neighborhood reading series. Both the JSON workspace and data-only CSV are included.

The complete [sample-workspace.json](./public/sample-workspace.json) includes valid provenance and is available from the information dialog. The data-only [sample-data.csv](./public/sample-data.csv) can be pasted into the CSV dialog. The same canonical sample is defined in the domain module for first use and confirmed restoration.

## 🚀 Local Development

Use Node.js **24 or later**:

```bash
npm ci
npm run dev
```

Vite prints the local URL and binds to `0.0.0.0` for the shared container. Inspect a production bundle with:

```bash
npm run build
npm run preview
```

## 🧩 Vue Implementation

[`DataTable.vue` is a generic SFC](https://vuejs.org/api/sfc-script-setup.html#generics) with `T extends { id: string }`. Its readonly row props determine `keyof T` column keys and the `T[keyof T]` value exposed through `defineSlots`. The app supplies native label/value inputs through the typed cell slot and a removal action through a second typed slot. Table structure and keyed row rendering stay reusable; input parsing remains in the parent.

The editor keeps textual numeric drafts separate from the validated numeric workspace. Valid edits replace the canonical workspace and save locally. A blank value, unsupported exponent/formula, empty label/title, or excessive precision leaves the last valid plot and save in place. SVG export is disabled until all pending edits are valid; JSON and CSV can still preserve the last valid workspace.

`ChartPreview.vue` renders actual SVG elements with computed geometry. Bars share a visible zero baseline and correctly extend above or below it. A line follows row order and connects categorical positions at equal spacing; it is not a time-series parser. Each chart uses unique `useId` title/description references. Theme colors, fixed preview height, bounded caption scroll area, and fitted category labels keep the editor readable across states. A minimum drawing width preserves label readability on narrow screens; its named, focusable viewport scrolls horizontally with the keyboard or pointer.

The shared modal uses `Teleport`, a unique `useId` heading, and a post-flush watcher to synchronize Vue state with native `showModal`/`close`. Escape and focus return remain native. A queued close event cannot reset a modal that has already reopened.

## 💾 Local Drafts & Data Exchange

Validated workspace data is stored under `vue-chart-caption-studio:v1`. First-use and restored data are validated before use. Invalid saved JSON/schema falls back to the sample without immediately overwriting the damaged entry. A later valid change writes a new draft. Blocked storage leaves editing and downloads usable and shows a status message.

Import parses a detached candidate and replaces the workspace only after complete validation. Failure keeps current work and the saved draft intact. Workspace JSON is limited to **120,000 characters**. Known fields are rebuilt in canonical order; unknown fields and supplied provenance are not trusted or carried into the editable domain. Project markers are recomputed from validated data. Title, caption, unit, chart type, tone, and validated numeric points belong to the saved workspace. Pending textual editor values and dialog state are session-only.

| Field             | Accepted values                                                                   |
| ----------------- | --------------------------------------------------------------------------------- |
| `version`, `name` | Version `1`; nonblank title up to 80 characters                                   |
| `caption`, `unit` | Strings up to 320 / 30 characters; empty values allowed                           |
| `kind`, `tone`    | `bar` or `line`; `blue`, `clay`, or `teal`                                        |
| `rows`            | One to twelve points with unique safe IDs and nonblank labels up to 20 characters |
| `value`           | Actual finite number from −1,000 to 10,000 with at most two decimal places        |

CSV requires exactly `label,value` columns and 1–12 data rows. Headers may vary in case and surrounding whitespace. Quoted fields support escaped quotes and line breaks. Textual values accept ordinary signed decimals; blank cells, exponents, formulas, nonfinite values, and excessive precision are rejected. CSV text is limited to 20,000 characters.

SVG contains its own title, full accessible description, grid, baseline, chart artwork, caption, and CT metadata. It contains no Tailwind classes or external resources and uses the viewer’s system font. Category labels and long titles/caption lines are fitted to available drawing widths. Caption text appears in the SVG description and visible caption lines.

CSV contains only labels and values and uses quoted labels plus CRLF. Importing CSV replaces the data points while retaining current chart settings and caption; it assigns fresh sequential point IDs. JSON retains the complete workspace and stable identities. CSV is a data interchange format, not an exported spreadsheet application.

Download Blob URLs are revoked after download. Destructive collection removal, sample restoration, and baseline replacement where applicable use native confirmation dialogs.

## ◈ Project Markers

- `CT` appears in the wordmark, original favicon, project metadata, and workspace identity.
- `CT-XXXXXXXX` is a deterministic 32-bit content stamp calculated from the canonical validated workspace, excluding supplied provenance.
- JSON provenance includes the project slug, `CodeSculptor`, and the marker. Downloaded artifacts carry the appropriate identity in filenames and/or metadata/content.
- Markers help identify configurations and artifacts; they are not cryptographic signatures or tamper-proof authorship claims.
- Author metadata and the MIT license retain CodeSculptor attribution.

## 🧭 Extension Notes & Nuances

- The included values are fictional demo data. The application does not retrieve data, infer statistical meaning, or write captions automatically.
- There is one series and one unit. Line points are categorical and equally spaced, even if a label resembles a date.
- The scale always includes zero. All-zero data uses a finite 0–1 plotting range.
- Compact summary numbers have full numeric values in their title attributes. Data cells and axis labels retain decimal formatting.
- Chart previews use locally bundled fonts; standalone SVG uses system fonts and fitted text. Very long labels on dense charts can be visually compressed.
- Pending invalid edits stay in the editor. Import, confirmed sample restore, and data collection operations deliberately load a validated workspace.
- To add chart types, update geometry, the SFC preview, independent SVG export, and tests together.

The application and documentation are English. At 320 px panels stack, while larger screens use the shared grid. Scrollable data regions, named native controls, visible focus styles, and a single main landmark remain available across layouts.

## ✅ Build & Checks

```bash
npm run build
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

`build` runs `vue-tsc` before Vite. Native tests use Node’s built-in runner. Playwright starts the current production bundle with the local preview command and does not reuse another server. Build before browser tests so they inspect current output. `npm run format` formats maintained source; dependencies, generated output, lockfiles, and browser artifacts are excluded.

Native tests cover canonical sample/provenance, CSV quoting and malformed input, numeric boundaries, enum arrays, zero/signed geometry, and escaped standalone SVG. Browser checks exercise real generic slot inputs, last-valid persistence, CSV success/failure, type switching with fixed geometry, confirmed removal, narrow layouts with maximum-length text, and downloaded SVG parsing.

Shared browser workflows check valid/failed imports, persistence after reload, provenance downloads, blocked/corrupt storage, confirmed sample restoration, native modal reopening/Escape/focus, real Tailwind grid behavior, named visible controls, and overflow at 320–1440 px. These are local production checks, not a deployed Vercel smoke test.

## ▲ Vercel Deployment

1. Import the repository and select this project folder as the Root Directory when deploying from the shared workspace.
2. Use the committed config: `npm ci`, `npm run build`, and output folder `dist`.
3. Check the root page, public sample/artwork, and main editor after deployment.

The explicit `vercel.json` rewrites only `/` to `/index.html` and permanently redirects `/index.html` to `/`. There are no client routes requiring a catch-all rewrite. Declared routes preserve missing-resource behavior. HTML and unhashed public files revalidate; Vite’s hashed JS/CSS/font assets receive one-year immutable caching. All responses include `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. The dev command accepts Vercel’s `$PORT` with `--strictPort`.

Used fields, route compilation, and generated asset/cache behavior are checked locally against the [official Vercel configuration schema](https://openapi.vercel.sh/vercel.json). Vite preview does not emulate deployment headers. SVG social artwork is included as an editable source; platforms requiring raster cards need a rendered image and an absolute deployed image URL.

## 📄 License

[MIT](./LICENSE) · Copyright (c) 2026 **CodeSculptor**. Bundled fonts retain separate OFL licenses.
