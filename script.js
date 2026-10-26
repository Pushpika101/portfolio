import { mountAboutReveal } from './scripts/animations/about-reveal.js?v=about-toolkit-7';
// Application entry point. Screen content lives in screens/.
import { enter } from './scripts/entrance.js?v=entrance-clean-12';
import './scripts/navigation.js?v=card-hitarea-16';
import './scripts/projects.js?v=project-close-19';
import { mountProjectOrbit } from './scripts/animations/project-orbit.js?v=card-hitarea-16';

mountProjectOrbit();
mountAboutReveal();

if (document.body.dataset.page === 'home' && location.hash === '#home') {
  enter('#home', false);
}
