// Persistent app elements and transition locks shared across screens.
export const entrance = document.querySelector('.entrance');
export const portal = document.querySelector('.portal');
export const portfolio = document.querySelector('.portfolio');
export const theme = document.querySelector('meta[name="theme-color"]');
export const state = { entering: false, navigating: false };
