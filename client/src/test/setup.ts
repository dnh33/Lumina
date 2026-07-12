import "@testing-library/jest-dom";

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
