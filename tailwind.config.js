/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      aspectRatio: {
        '4/3': '4 / 3',
        '3/2': '3 / 2',
        '2/1': '2 / 1',
        '9/16': '9 / 16',
        '21/9': '21 / 9',
      },
    },
  },
  plugins: [],
  safelist: [
    // Ensure custom aspect ratio classes are included
    'aspect-[4/3]',
    'aspect-[3/2]',
    'aspect-[2/1]',
    'aspect-[9/16]',
    'aspect-[21/9]',
    // Dynamic aspect ratios
    {
      pattern: /aspect-\[[\d]+\/[\d]+\]/,
    },
  ],
}
