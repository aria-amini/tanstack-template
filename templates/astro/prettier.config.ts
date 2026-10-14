import type { Config } from 'prettier'

// Prettier formats only .astro files, because oxfmt has no Astro support yet.
// The options mirror the oxfmt settings in vite.config.ts.
export default {
	singleQuote: true,
	semi: false,
	useTabs: true,
	printWidth: 80,
	plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
	tailwindStylesheet: './src/styles/global.css',
	overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
} satisfies Config
