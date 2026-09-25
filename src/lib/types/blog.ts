export type BlogCategory =
	'Semua' | 'Mulai' | 'Produk Digital' | 'Sesi' | 'Layanan' | 'Jual & Bagikan' | 'Cerita Orang';

export interface BlogCategoryRecord {
	id: string;
	name: string;
	slug: string;
	description?: string;
	active: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface BlogAuthor {
	id: string;
	name: string;
	slug: string;
	role?: string;
	bio?: string;
	avatarAssetId?: string;
	avatarUrl?: string;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface BlogContentBlock {
	id?: string;
	type:
		| 'paragraph'
		| 'h2'
		| 'h3'
		| 'blockquote'
		| 'bullet_list'
		| 'numbered_list'
		| 'callout'
		| 'image';
	text?: string;
	items?: string[];
	quote?: string;
	author?: string;
	imageUrl?: string;
	imageAlt?: string;
	imageCaption?: string;
	assetId?: string;
	calloutTitle?: string;
	calloutText?: string;
	calloutCtaLabel?: string;
}

export type BlogPostStatus = 'draft' | 'published' | 'archived' | 'scheduled';

export interface BlogPost {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	content: BlogContentBlock[];
	coverImage: string;
	coverImageAlt: string;
	category: Exclude<BlogCategory, 'Semua'> | string;
	categoryId?: string;
	author: {
		id?: string;
		name: string;
		role?: string;
		avatar?: string;
	};
	authorId?: string;
	authorName?: string;
	authorRole?: string;
	authorAvatar?: string;
	readingTime: string; // e.g. "7 menit baca" or "7 menit"
	readTime?: string;
	publishedAt: string; // e.g. "13 September 2026" or ISO string
	updatedAt?: string;
	status: BlogPostStatus;
	scheduledAt?: string;
	featured?: boolean;
	createdByUserId?: string;
	lastEditedByUserId?: string;
	seoTitle?: string;
	metaDescription?: string;
	tags?: string[];
	ogImage?: string;
	viewsCount?: number;
}
