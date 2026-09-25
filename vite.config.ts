import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	build: {
		chunkSizeWarningLimit: 1000
	},
	optimizeDeps: {
		// bits-ui @lucide/svelte berisi kode komponen Svelte — kalau di-prebundle,
		// Vite ikut mem-bundle salinan runtime svelte kedua dan merusak reactivity di dev.
		exclude: ['bits-ui', '@lucide/svelte', '@internationalized/date']
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Use Vercel's SSR adapter so server routes and hooks are deployed as functions.
			adapter: adapter()
		}),

		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			// Tanpa prefix locale di URL (/dashboard, /{username} harus tetap canonical).
			// Locale dideteksi dari cookie (SSR: globalVariable), fallback baseLocale "id".
			strategy: ['cookie', 'globalVariable', 'baseLocale']
		})
	],
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
