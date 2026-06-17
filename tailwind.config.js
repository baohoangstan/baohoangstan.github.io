/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  corePlugins: {
    preflight: false,
  },
  content: [
    './src/**/*.{js,jsx,ts,tsx,mdx}',
    './docs/**/*.{md,mdx}',
    './blog/**/*.{md,mdx}',
    './about/**/*.{md,mdx}',
    './tools/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      // Billowy, "cloud" shadows: large blur, low alpha, cool sky tint.
      // Standard keys are redefined so existing shadow-* usage softens too,
      // and tailwind-merge dedupes cleanly with shadcn component defaults.
      boxShadow: {
        sm: '0 1px 2px -1px hsl(215 30% 25% / 0.06), 0 2px 8px -3px hsl(215 30% 25% / 0.08)',
        DEFAULT:
          '0 2px 6px -2px hsl(215 30% 25% / 0.07), 0 6px 18px -4px hsl(215 30% 25% / 0.10)',
        md: '0 4px 12px -3px hsl(215 30% 25% / 0.08), 0 10px 28px -6px hsl(215 30% 25% / 0.12)',
        lg: '0 8px 22px -5px hsl(215 30% 25% / 0.10), 0 18px 46px -10px hsl(215 30% 25% / 0.16)',
        xl: '0 12px 32px -6px hsl(215 30% 25% / 0.12), 0 28px 64px -14px hsl(215 30% 25% / 0.20)',
        '2xl':
          '0 24px 60px -12px hsl(215 30% 25% / 0.18), 0 40px 90px -20px hsl(215 30% 25% / 0.26)',
        glow: '0 0 0 1px hsl(206 74% 55% / 0.14), 0 10px 36px -8px hsl(206 74% 50% / 0.30)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
