import shadcn from '@shadcn/lint'
import tsParser from '@typescript-eslint/parser'
import * as astroParser from 'astro-eslint-parser'
import { defineConfig } from 'eslint/config'

// Oxlint reads only the frontmatter of .astro files. ESLint parses the template
// markup, so the @shadcn/lint class rules also check Astro markup.
export default defineConfig({
	files: ['src/**/*.astro'],
	languageOptions: {
		parser: astroParser,
		parserOptions: { parser: tsParser, extraFileExtensions: ['.astro'] },
	},
	plugins: { shadcn },
	rules: {
		'shadcn/no-raw-colors': 'error',
		'shadcn/no-unknown-classes': 'error',
		'shadcn/no-arbitrary-values': ['error', { allow: ['layout'] }],
	},
})
