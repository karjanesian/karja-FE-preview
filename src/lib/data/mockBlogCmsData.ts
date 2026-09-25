/**
 * KARJA CANONICAL BLOG CMS SEED DATA
 * Unified categories and authors matching the public editorial content.
 */

import { BlogCategoryRecord, BlogAuthor } from '$lib/types/blog';

export const INITIAL_BLOG_CATEGORIES: BlogCategoryRecord[] = [
	{
		id: 'cat-mulai',
		name: 'Mulai',
		slug: 'mulai',
		description: 'Langkah awal menemukan apa yang bisa kamu jual tanpa ribet.',
		active: true,
		sortOrder: 1,
		createdAt: '2026-08-01T00:00:00Z',
		updatedAt: '2026-08-01T00:00:00Z'
	},
	{
		id: 'cat-produk-digital',
		name: 'Produk Digital',
		slug: 'produk-digital',
		description: 'Panduan merapikan spreadsheet, template, dan dokumen jadi file berbayar.',
		active: true,
		sortOrder: 2,
		createdAt: '2026-08-01T00:00:00Z',
		updatedAt: '2026-08-01T00:00:00Z'
	},
	{
		id: 'cat-sesi',
		name: 'Sesi',
		slug: 'sesi',
		description: 'Cara menjual waktu 30-60 menit obrolan terstruktur atau konsultasi 1-on-1.',
		active: true,
		sortOrder: 3,
		createdAt: '2026-08-01T00:00:00Z',
		updatedAt: '2026-08-01T00:00:00Z'
	},
	{
		id: 'cat-layanan',
		name: 'Layanan',
		slug: 'layanan',
		description: 'Menjual bantuan praktis yang jelas cakupan dan durasi pengerjaannya.',
		active: true,
		sortOrder: 4,
		createdAt: '2026-08-01T00:00:00Z',
		updatedAt: '2026-08-01T00:00:00Z'
	},
	{
		id: 'cat-jual-bagikan',
		name: 'Jual & Bagikan',
		slug: 'jual-bagikan',
		description: 'Menyebarkan link produk secara natural tanpa merasa malu atau mengganggu.',
		active: true,
		sortOrder: 5,
		createdAt: '2026-08-01T00:00:00Z',
		updatedAt: '2026-08-01T00:00:00Z'
	},
	{
		id: 'cat-cerita-orang',
		name: 'Cerita Orang',
		slug: 'cerita-orang',
		description: 'Kisah nyata perjalanan seller biasa yang memulai dari hal sederhana.',
		active: true,
		sortOrder: 6,
		createdAt: '2026-08-01T00:00:00Z',
		updatedAt: '2026-08-01T00:00:00Z'
	}
];

export const INITIAL_BLOG_AUTHORS: BlogAuthor[] = [
	{
		id: 'author-editorial',
		name: 'Tim Karja',
		slug: 'tim-karja',
		role: 'Editorial & Curation',
		bio: 'Tim kurasi dan riset praktis Karja yang menulis panduan langkah demi langkah.',
		avatarUrl:
			'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
		active: true,
		createdAt: '2026-08-01T00:00:00Z',
		updatedAt: '2026-08-01T00:00:00Z'
	},
	{
		id: 'author-rian',
		name: 'Rian Ardianto',
		slug: 'rian-ardianto',
		role: 'Guest Contributor',
		bio: 'Freelancer dan konsultan Notion yang berbagi pengalaman nyata menjual template pertama.',
		avatarUrl:
			'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
		active: true,
		createdAt: '2026-08-10T00:00:00Z',
		updatedAt: '2026-08-10T00:00:00Z'
	},
	{
		id: 'author-kimmy',
		name: 'Kimmy',
		slug: 'kimmy',
		role: 'Community Story',
		bio: 'Staf admin keuangan yang merintis checklist pajak praktis untuk sesama pekerja.',
		avatarUrl:
			'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
		active: true,
		createdAt: '2026-08-15T00:00:00Z',
		updatedAt: '2026-08-15T00:00:00Z'
	}
];
