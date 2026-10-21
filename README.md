# Pushpika Anuradha — Portfolio

A static multipage portfolio with a dark entrance, persistent right-side navigation, and a curved 3D page turn.

## Run and debug

Run `npm run dev`, then open http://localhost:5173. Use the HTTP server: JavaScript modules and animated navigation require HTTP rather than opening files directly.

After editing HTML in `screens/` or `layouts/`, run `npm run build` and refresh. JavaScript and CSS edits only need a refresh. Run `npm run check` to check every script and verify all generated pages are current.

## Screen files

| Edit this file | What it controls | Preview |
| --- | --- | --- |
| `screens/entrance.html` | Loading/entrance pill and intro text | `/index.html` |
| `screens/home.html` | Portrait, social links, and ticker | `/index.html#home` (skips intro) |
| `screens/about.html` | About page | `/about.html` |
| `screens/projects.html` | Projects page | `/projects.html` |
| `screens/contact.html` | Contact page | `/contact.html` |
| `layouts/page.html` | Shared document, header, footer, and fixed navigation | Every page |

The root HTML files are generated entry pages. Edit their source screen or layout instead; the build preserves the existing URLs and marks the active navigation tab.

## JavaScript debugging

- `script.js`: application entry point.
- `scripts/dom.js`: persistent elements and shared transition locks.
- `scripts/entrance.js`: proximity hover, Explore, and entrance animation.
- `scripts/navigation.js`: page fetching, browser history, replay, and navigation click handling.
- `scripts/animations/page-turn.js`: curved sheet geometry, timing, and rendering. Set breakpoints here when debugging the page turn.
- `style.css`: shared appearance, responsive layouts, and animation surface styles.

For page-content debugging, open its direct URL. Enable your browser's reduced-motion emulation to skip transitions and isolate layout issues. Navigation stays outside animated page content.

## Assets and deployment

The portrait is `assets/pushpika-portrait.png`. Five project slots are ready in `screens/projects.html`. Each `PROJECT 1` through `PROJECT 5` comment marks one editable card. Replace its title, category, year, and the text in its project details dialog. Remove unused `<article>` blocks to show fewer projects.

For a real cover, replace the `.cover-sculpture` element with `<img class="project-cover-image" src="assets/your-project.jpg" alt="Describe your project screenshot">` and remove the `.cover-note` placeholder. Replace the two `.project-links` spans with links to your live demo and repository when available. Run `npm run build` after edits.

Run `npm run build` before deploying. Serve the project as static files, including the generated root HTML, `script.js`, `scripts/`, `style.css`, and `assets/`. No runtime dependencies are required. Google Fonts falls back to Arial offline.
