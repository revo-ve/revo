/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ============================================
      // REVO Design System — Paleta TOQUE
      // ============================================
      colors: {
        // Primary: Arcilla (warm terracotta)
        arcilla: {
          50: '#fdf5f0',
          100: '#fbe8db',
          200: '#f6cdb7',
          300: '#f0ab88',
          400: '#e88458',
          500: '#C1694F', // PRIMARY — Arcilla REVO
          600: '#a8533b',
          700: '#8c4132',
          800: '#73372c',
          900: '#5f2f27',
          950: '#331613',
        },
        // Secondary: Salvia (sage green)
        salvia: {
          50: '#f4f7f4',
          100: '#e4ebe3',
          200: '#c9d7c7',
          300: '#a4bca1',
          400: '#7d9e79',
          500: '#6B8F71', // SECONDARY — Salvia
          600: '#4a6b4e',
          700: '#3c5540',
          800: '#324535',
          900: '#2a3a2d',
          950: '#141f17',
        },
        // Accent: Miel (honey gold)
        miel: {
          50: '#fefbec',
          100: '#fdf3c9',
          200: '#fbe58e',
          300: '#f8d354',
          400: '#f5c126',
          500: '#D4A843', // ACCENT — Miel
          600: '#b8892d',
          700: '#996527',
          800: '#7d5026',
          900: '#684223',
          950: '#3c2210',
        },
        // Neutral: Oliva (olive dark)
        oliva: {
          50: '#f6f6f2',
          100: '#e8e8df',
          200: '#d3d3c3',
          300: '#b8b8a0',
          400: '#9e9e80',
          500: '#8a8a6c',
          600: '#6f6f57',
          700: '#595947',
          800: '#4a4a3c',
          900: '#2C3A2E', // DARK BG — Oliva
          950: '#1a2119',
        },
        // Semantic colors
        cream: '#FAF6F1',    // Background claro
        sand: '#F0EAE0',     // Surface
        bark: '#3D2E2A',     // Text oscuro
      },
      fontFamily: {
        // Archivo: Logo + Headings (geométrica, bold)
        heading: ['Archivo', 'system-ui', 'sans-serif'],
        // Plus Jakarta Sans: UI elements (clean, modern)
        ui: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        // Outfit: Body text (friendly, readable)
        body: ['Outfit', 'system-ui', 'sans-serif'],
        // Cormorant Garamond: Accent/editorial (el ADN de TOQUE)
        accent: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      borderRadius: {
        'revo': '12px',     // Default card radius
        'revo-sm': '8px',   // Smaller elements
        'revo-lg': '16px',  // Large cards
      },
      boxShadow: {
        'revo': '0 1px 3px rgba(44, 58, 46, 0.08), 0 4px 12px rgba(44, 58, 46, 0.04)',
        'revo-md': '0 4px 16px rgba(44, 58, 46, 0.1), 0 1px 4px rgba(44, 58, 46, 0.06)',
        'revo-lg': '0 8px 32px rgba(44, 58, 46, 0.12), 0 2px 8px rgba(44, 58, 46, 0.06)',
      },
    },
  },
  plugins: [],
};
