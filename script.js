import { mountAboutReveal } from './scripts/animations/about-reveal.js?v=about-toolkit-7';
// Application entry point. Screen content lives in screens/.
import { enter } from './scripts/entrance.js';
import './scripts/navigation.js?v=about-toolkit-7';
import './scripts/projects.js';
import { mountProjectOrbit } from './scripts/animations/project-orbit.js?v=about-toolkit-7';

mountProjectOrbit();
mountAboutReveal();

if (document.body.dataset.page === 'home' && location.hash === '#home') {
  enter('#home', false);
}
