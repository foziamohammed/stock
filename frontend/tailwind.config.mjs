// tailwind.config.mjs
export default {
  darkMode: 'class', // Set to class-based dark mode
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Include all relevant source files
    './index.html', // Include the HTML file if used
  ],
  theme: {
    extend: {}, // Add custom theme extensions here if needed
  },
};