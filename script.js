// Application entry point. Screen content lives in screens/.
import { enter } from './scripts/entrance.js';
import './scripts/navigation.js?v=projects-stack-3';
import './scripts/projects.js';
import { mountProjectOrbit } from './scripts/animations/project-orbit.js?v=projects-stack-3';

mountProjectOrbit();

if (document.body.dataset.page === 'home' && location.hash === '#home') {
  enter('#home', false);
}
