import { mountContactReveal } from './scripts/animations/contact-reveal.js?v=live-scope-26';
import { mountAboutReveal } from './scripts/animations/about-reveal.js?v=live-scope-26';
// Application entry point. Screen content lives in screens/.
import { enter } from './scripts/entrance.js?v=entrance-clean-12';
import './scripts/navigation.js?v=layout-flow-30';
import './scripts/projects.js?v=project-gallery-29';
import { mountProjectOrbit } from './scripts/animations/project-orbit.js?v=layout-flow-30';

mountProjectOrbit();
mountContactReveal();
mountAboutReveal();

if (document.body.dataset.page === 'home' && location.hash === '#home') {
  enter('#home', false);
}
