import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	{
		// Typed-route resolver terlalu ribet untuk prototipe (dynamic path & literal goto);
		// SvelteKit tetap resolve rute dengan benar saat runtime.
		rules: {
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/prefer-writable-derived': 'off',
			'svelte/prefer-svelte-reactivity': 'off',
			// Kode domain/data dipindah 1:1 dari prototipe React — jangan dipoles di lint.
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }
			],
			'no-empty': ['error', { allowEmptyCatch: true }],
			'no-useless-assignment': 'off',
			'svelte/no-useless-mustaches': 'warn'
		}
	},
	{
		// File domain/data port 1:1 dari prototipe — biarkan berisik kalau perlu.
		files: ['src/lib/domain/**', 'src/lib/data/**'],
		rules: { '@typescript-eslint/no-unused-vars': 'warn' }
	}
);
