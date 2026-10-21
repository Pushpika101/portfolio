# Pushpika Anuradha — Portfolio

A dependency-free, responsive portfolio combining a proximity-sensitive white entrance with a dark portrait-led homepage.

## Preview

Run `npm run dev` and open http://localhost:5173. You can also open `index.html` directly. Run `npm run check` to check JavaScript syntax.

## Personalize

- The edited portrait is `assets/pushpika-portrait.png`, used in the homepage hero.
- Replace `assets/entrance.svg` with your preferred entrance image.
- Add real projects to `projects.html`. The current artwork is a clearly labeled placeholder, not a claimed project.
- Each page has shared header/footer markup. Keep contact details and navigation consistent across `index.html`, `about.html`, `projects.html`, and `contact.html`.

The intro supports pointer proximity, keyboard focus, touch, reduced motion, and skipping. Home, About, Projects, and Contact are separate HTML pages. Right-side navigation progressively enhances normal links with a translucent page-turn reveal and browser history support. Direct links and refreshes work on any static host. The footer can replay the entrance.

Deploy the folder to any static host; no build or runtime dependencies are needed. Google Fonts is optional; the site falls back to Arial offline.
