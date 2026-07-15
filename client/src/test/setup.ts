import "@testing-library/jest-dom";

// Clear persisted state between tests. The genre world state (Task 4.4) is
// kept in localStorage, and jsdom shares one store across the whole worker —
// without this, a world's persisted mode/mediaType/filter leaks between test
// files and corrupts isolated assertions.
afterEach(() => {
  localStorage.clear();
});

// jsdom lacks matchMedia; provide a default (no reduced motion) so
// framer-motion's useReducedMotion() works in every test. Individual
// tests override this to simulate prefers-reduced-motion.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
