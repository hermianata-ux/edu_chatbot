// Polyfill process.env for browser environments to prevent crashes
// if the build system doesn't automatically inject it.
if (typeof process === 'undefined') {
  (window as any).process = {
    env: {
      // In a real local setup, this would be populated by your bundler (Vite/Webpack)
      // from a .env file.
      // You can also manually set your key here for simple browser testing if .env isn't working.
      API_KEY: 'AIzaSyB1Mi0GWFfL757qP5CR3YoAKo8fTRyy56A' 
    }
  };
} else if (!process.env) {
  // Handle case where process exists but env is missing
  (process as any).env = {
    API_KEY: 'AIzaSyB1Mi0GWFfL757qP5CR3YoAKo8fTRyy56A'
  };
}
