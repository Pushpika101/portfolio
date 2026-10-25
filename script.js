// Application entry point. Screen content lives in screens/.
import { enter } from './scripts/entrance.js';
import './scripts/navigation.js';
import './scripts/projects.js';
import './scripts/animations/water-cursor.js';

if (document.body.dataset.page === 'home' && location.hash === '#home') {
  enter('#home', false);
}
