/**
 * KARJA ADMIN & PLATFORM MOCK DATA (Phase 0)
 * Representative platform-scale mock data for multi-seller operations,
 * verification queues, payouts, moderation, reports, disputes, and financial ledger.
 */

import {
	PlatformUser,
	Payment,
	ExtendedPayout,
	Report,
	Dispute,
	Refund,
	LedgerEntry,
	AuditLog,
	PlatformConfig,
	DEFAULT_PLATFORM_CONFIG,
	AdminBlogPost,
	BlogPost,
	PlatformSettings
} from '$lib/types/admin';
import { SellerProfile, Product, Order, Transaction, Review } from '$lib/types';
import { MOCK_ADMIN_FILES } from './mockFilesData';
import { INITIAL_BLOG_ARTICLES } from './blogArticles';

// ============================================================================
// 1. Platform Staff & Test Users
// ============================================================================
export const MOCK_ADMIN_USERS: PlatformUser[] = [
	{
		id: 'user_admin_riana',
		name: 'Riana Safitri',
		email: 'riana.ops@karja.id',
		role: 'ops',
		status: 'active',
		createdAt: '2026-01-10T08:00:00.000Z',
		updatedAt: '2026-09-01T10:00:00.000Z',
		phone: '081288990011'
	},
	{
		id: 'user_admin_bima',
		name: 'Bima Pradana',
		email: 'bima.lead@karja.id',
		role: 'super_admin',
		status: 'active',
		createdAt: '2026-01-01T08:00:00.000Z',
		updatedAt: '2026-09-01T10:00:00.000Z',
		phone: '081122334455'
	},
	{
		id: 'user_seller_dimas',
		name: 'Dimas Prasetyo',
		email: 'dimas@karja.id',
		role: 'seller',
		status: 'active',
		createdAt: '2026-03-01T09:00:00.000Z',
		updatedAt: '2026-09-10T12:00:00.000Z',
		phone: '081234567890'
	}
];

// Active admin session default (null by default for real login requirement)
export const CURRENT_MOCK_ADMIN: PlatformUser | null = null;

// ============================================================================
// 2. Representative Multi-Sellers (6 Indonesian Creators)
// ============================================================================
export const MOCK_ADMIN_SELLERS: SellerProfile[] = [
	{
		id: 'seller_dimas',
		userId: 'user_seller_dimas',
		name: 'Dimas Prasetyo',
		username: 'dimasprasetyo',
		email: 'dimas@karja.id',
		tagline: 'Praktisi Notetaking & Produktivitas Kerja',
		bio: 'Berbagi template sistem kerja pribadi, Notion template, dan sesi mentoring 1-on-1 untuk profesional muda.',
		topics: ['Produktivitas', 'Notion', 'Karier'],
		whatsapp: '081234567890',
		instagram: 'dimasprasetyo',
		linkedin: 'dimas-prasetyo',
		tiktok: 'dimasnotes',
		showWhatsappOnStore: true,
		avatarUrl:
			'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
		bankInfo: {
			bank: 'BCA',
			accountNumber: '8820394821',
			accountHolder: 'Dimas Prasetyo'
		},
		verification: {
			status: 'verified',
			submittedAt: '2026-04-01T10:00:00.000Z',
			verifiedAt: '2026-04-02T14:30:00.000Z',
			reviewedBy: 'Riana Safitri'
		}
	},
	{
		id: 'seller_maya',
		userId: 'user_seller_maya',
		name: 'Maya Indah Lestari',
		username: 'mayaindah',
		email: 'maya.lestari@gmail.com',
		tagline: 'Desainer Grafis & Brand Identity Freelancer',
		bio: 'Menyediakan starter kit Figma, palet warna lokal, dan jasa konsultasi audit logo UMKM.',
		topics: ['Desain', 'Branding', 'Figma'],
		whatsapp: '081399887766',
		instagram: 'mayadesign',
		linkedin: 'maya-indah',
		tiktok: '',
		showWhatsappOnStore: true,
		avatarUrl:
			'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
		bankInfo: {
			bank: 'Bank Mandiri',
			accountNumber: '1370019283746',
			accountHolder: 'Maya Indah Lestari'
		},
		verification: {
			status: 'verified',
			submittedAt: '2026-05-10T11:00:00.000Z',
			verifiedAt: '2026-05-11T09:00:00.000Z',
			reviewedBy: 'Riana Safitri'
		}
	},
	{
		id: 'seller_reza',
		userId: 'user_seller_reza',
		name: 'Reza Firmansyah',
		username: 'rezafirmansyah',
		email: 'reza.tech@outlook.com',
		tagline: 'Fullstack Dev & Resume Reviewer',
		bio: 'Membantu fresh graduates lolos screen CV software engineering & coding mock interview.',
		topics: ['Teknologi', 'Karier Tech', 'CV Review'],
		whatsapp: '085711223344',
		instagram: 'rezacodes',
		linkedin: 'reza-firmansyah',
		tiktok: 'reza_dev',
		showWhatsappOnStore: false,
		avatarUrl:
			'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
		bankInfo: {
			bank: 'BRI',
			accountNumber: '020601058392501',
			accountHolder: 'Reza Firmansyah'
		},
		verification: {
			status: 'pending',
			submittedAt: '2026-09-12T04:20:00.000Z',
			idCardNumber: '3174092003880002',
			idCardPhotoUrl:
				'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80'
		}
	},
	{
		id: 'seller_anisa',
		userId: 'user_seller_anisa',
		name: 'Anisa Kusuma',
		username: 'anisakusuma',
		email: 'anisa.copy@yahoo.com',
		tagline: 'Praktisi Copywriting & Micro-Storytelling',
		bio: 'Panduan menulis caption penjualan santai yang disukai pembeli tanpa bahasa kaku.',
		topics: ['Copywriting', 'Pemasaran', 'Tulisan'],
		whatsapp: '081299008811',
		instagram: 'anisabercerita',
		linkedin: '',
		tiktok: 'anisastory',
		showWhatsappOnStore: true,
		avatarUrl:
			'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
		bankInfo: {
			bank: 'BCA',
			accountNumber: '5271928401',
			accountHolder: 'Anisa Kusuma'
		},
		verification: {
			status: 'needs_update',
			submittedAt: '2026-09-08T15:00:00.000Z',
			reviewedAt: '2026-09-09T10:00:00.000Z',
			reviewedBy: 'Riana Safitri',
			rejectionReason: 'Foto KTP buram dan nama pada rekening berbeda satu kata.'
		}
	},
	{
		id: 'seller_hendra',
		userId: 'user_seller_hendra',
		name: 'Hendra Wijaya',
		username: 'hendrawijaya',
		email: 'hendra.finance@gmail.com',
		tagline: 'Penyusun Spreadsheet Keuangan Keluarga',
		bio: 'Menyediakan template Excel/Sheets pelacak pengeluaran dan kalkulator dana darurat siap pakai.',
		topics: ['Keuangan', 'Spreadsheet', 'Excel'],
		whatsapp: '081344556677',
		instagram: '',
		linkedin: 'hendra-wijaya',
		tiktok: '',
		showWhatsappOnStore: true,
		avatarUrl:
			'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
		bankInfo: {
			bank: 'Bank BNI',
			accountNumber: '0892019482',
			accountHolder: 'Hendra Wijaya'
		},
		verification: {
			status: 'verified',
			submittedAt: '2026-06-15T08:00:00.000Z',
			verifiedAt: '2026-06-16T11:00:00.000Z',
			reviewedBy: 'Riana Safitri'
		}
	},
	{
		id: 'seller_citra',
		userId: 'user_seller_citra',
		name: 'Citra Permata',
		username: 'citrapermata',
		email: 'citra.permata@gmail.com',
		tagline: 'Mentor Belajar Public Speaking Pemula',
		bio: 'Sesi latihan bicara depan umum yang hangat dan aman bagi yang sering grogi.',
		topics: ['Public Speaking', 'Komunikasi', 'Mentoring'],
		whatsapp: '082199882233',
		instagram: 'citrabicara',
		linkedin: 'citra-permata',
		tiktok: '',
		showWhatsappOnStore: true,
		avatarUrl:
			'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
		bankInfo: {
			bank: 'BSI',
			accountNumber: '7192840192',
			accountHolder: 'Citra Permata'
		},
		verification: {
			status: 'unverified'
		}
	}
];

// ============================================================================
// 3. Representative Products (12 Products across 6 Sellers)
// ============================================================================
export const MOCK_ADMIN_PRODUCTS: Product[] = [
	{
		id: 'prod_notion_dimas',
		sellerId: 'seller_dimas',
		title: 'Template Notion Sistem Kerja Harian',
		slug: 'template-notion-sistem-kerja-harian',
		type: 'digital',
		category: 'Produktivitas',
		price: 49000,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		moderationStatus: 'approved',
		images: [
			'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&auto=format&fit=crop&q=80'
		],
		shortDescription:
			'Template Notion yang langsung bisa dipakai untuk merapikan proyek mingguan dan catatan kerja.',
		targetAudience: 'Karyawan dan pekerja lepas yang overwhelmed dengan to-do list berantakan.',
		problemSolved: 'Membantu menata fokus harian tanpa repot setup database Notion dari awal.',
		whatYouGet: 'Akses duplikasi workspace Notion, video panduan 7 menit, dan cheatsheet shortcut.',
		howItWorks: 'Setelah bayar, klik link langsung duplikat ke akun Notion milikmu.',
		aboutCreator:
			'Dimas telah menggunakan sistem ini selama 3 tahun mengelola 20+ proyek bersamaan.',
		faqs: [
			{
				id: 'faq_notion_1',
				question: 'Apakah butuh Notion berbayar?',
				answer: 'Tidak, cukup akun Notion gratis.'
			}
		],
		digitalDeliveryType: 'external_link',
		externalAccessUrl: 'https://notion.so/karja-template-preview-dimas',
		views: 420,
		sales: 38,
		revenue: 1862000,
		buyClicks: 82,
		createdAt: '2026-03-15T10:00:00.000Z'
	},
	{
		id: 'prod_mentoring_dimas',
		sellerId: 'seller_dimas',
		title: 'Sesi 1-on-1: Tata Ulang Rutinitas Kerja',
		slug: 'sesi-tata-ulang-rutinitas-kerja',
		type: 'session',
		category: 'Produktivitas',
		price: 150000,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		moderationStatus: 'approved',
		images: [
			'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80'
		],
		shortDescription:
			'Sesi video call 45 menit untuk bedah jadwal mingguanmu dan susun alur kerja bebas stres.',
		targetAudience: 'Profesional yang merasa waktunya habis tanpa menghasilkan pekerjaan penting.',
		problemSolved: 'Mendapat jadwal terstruktur yang realistis dijalankan, bukan sekadar teori.',
		whatYouGet:
			'45 menit diskusi Google Meet, rangkuman PDF rencana aksi, dan follow-up via WA 3 hari setelah sesi.',
		howItWorks:
			'Pilih jadwal yang pas saat checkout, kami kirim link Google Meet otomatis ke emailmu.',
		aboutCreator: 'Dimas telah memfasilitasi 50+ sesi produktivitas individu.',
		faqs: [
			{
				id: 'faq_mentoring_1',
				question: 'Apakah sesi bisa dijadwal ulang?',
				answer: 'Bisa, maksimal 6 jam sebelum sesi dimulai.'
			}
		],
		sessionDurationMinutes: 45,
		meetingMethod: 'google_meet',
		views: 180,
		sales: 12,
		revenue: 1800000,
		buyClicks: 24,
		createdAt: '2026-04-01T11:00:00.000Z'
	},
	{
		id: 'prod_brandkit_maya',
		sellerId: 'seller_maya',
		title: 'Figma Starter Kit: Palet Warna & Font Brand Lokal',
		slug: 'figma-starter-kit-palet-warna-lokal',
		type: 'digital',
		category: 'Desain',
		price: 75000,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		moderationStatus: 'approved',
		images: [
			'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80'
		],
		shortDescription:
			'15 kombinasi warna hangat Nusantara dan panduan pairing font gratis untuk brand lokal.',
		targetAudience: 'Desainer junior, pemilik UMKM kuliner & kerajinan tangan.',
		problemSolved:
			'Mengatasi kebingungan memilih font dan warna yang serasi untuk kemasan dan media sosial.',
		whatYouGet:
			'File Figma editable, file PDF panduan hex color, dan link font open source Google Fonts.',
		howItWorks: 'Download langsung file PDF dan duplikasi file Figma setelah konfirmasi lunas.',
		aboutCreator: 'Maya telah merancang identitas visual untuk 40+ brand lokal Indonesia.',
		faqs: [],
		digitalDeliveryType: 'upload',
		fileDownloadName: 'Brandkit-Nusantara-Maya.zip',
		fileSize: '18.4 MB',
		views: 310,
		sales: 24,
		revenue: 1800000,
		buyClicks: 52,
		createdAt: '2026-05-20T08:30:00.000Z'
	},
	{
		id: 'prod_audit_maya',
		sellerId: 'seller_maya',
		title: 'Audit Desain Logo & Feed Instagram UMKM',
		slug: 'audit-desain-logo-feed-umkm',
		type: 'service',
		category: 'Desain',
		price: 199000,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		moderationStatus: 'approved',
		images: [
			'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&auto=format&fit=crop&q=80'
		],
		shortDescription:
			'Analisis visual toko atau bisnismu lengkap dengan 5 rekomendasi perbaikan cepat dalam 48 jam.',
		targetAudience:
			'Pemilik bisnis lokal yang merasa tampilan toko online atau Instagramnya kurang meyakinkan.',
		problemSolved: 'Mendapat feedback jujur dan solusi visual praktis dari desainer berpengalaman.',
		whatYouGet: 'Laporan PDF visual 4 halaman + rekaman video Loom 10 menit mengulas feed tokomu.',
		howItWorks: 'Isi link Instagram tokomu saat order, hasil audit dikirim maksimal 2 hari kerja.',
		aboutCreator: 'Maya telah berpengalaman 6 tahun di industri branding agency.',
		faqs: [],
		serviceTimelineDays: 2,
		serviceRevisions: 1,
		views: 145,
		sales: 8,
		revenue: 1592000,
		buyClicks: 19,
		createdAt: '2026-06-02T13:10:00.000Z'
	},
	{
		id: 'prod_resume_reza',
		sellerId: 'seller_reza',
		title: 'Review CV Software Engineer Lolos Screening',
		slug: 'review-cv-software-engineer',
		type: 'service',
		category: 'Karier Tech',
		price: 120000,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		moderationStatus: 'pending_review',
		moderationReason: 'Produk baru diajukan oleh seller dengan verifikasi dalam proses.',
		images: [
			'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80'
		],
		shortDescription:
			'Komentar baris per baris pada format ATS, deskripsi impact proyek, dan poin teknis CV-mu.',
		targetAudience: 'Fresh graduate IT dan junior developer yang sedang kirim lamaran kerja.',
		problemSolved: 'Mencegah CV ditolak otomatis di tahap ATS sebelum sempat dibaca recruiter.',
		whatYouGet:
			'Anotasi detail pada file PDF CV, saran rewrite bullet point, dan 1x revisi tindak lanjut.',
		howItWorks: 'Kirimkan file PDF CV-mu, hasil review dikembalikan via email dalam 24 jam.',
		aboutCreator: 'Reza adalah software engineer di startup teknologi terkemuka di Jakarta.',
		faqs: [],
		serviceTimelineDays: 1,
		serviceRevisions: 1,
		views: 290,
		sales: 15,
		revenue: 1800000,
		buyClicks: 40,
		createdAt: '2026-09-10T14:00:00.000Z'
	},
	{
		id: 'prod_interview_reza',
		sellerId: 'seller_reza',
		title: 'Mock Interview Teknis Front-End / React',
		slug: 'mock-interview-teknis-react',
		type: 'session',
		category: 'Karier Tech',
		price: 250000,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		moderationStatus: 'approved',
		images: [
			'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
		],
		shortDescription:
			'Simulasi wawancara teknis 60 menit dengan live coding dan feedback jujur mengenai kesiapanmu.',
		targetAudience:
			'Developer yang ingin melatih mental dan cara berkomunikasi saat live interview.',
		problemSolved: 'Mengurangi rasa gugup dan mengetahui gap pengetahuan sebelum interview asli.',
		whatYouGet: '60 menit mock interview via Google Meet + rubrik penilaian standar industri.',
		howItWorks: 'Pilih jadwal yang tersedia di kalender checkout.',
		aboutCreator: 'Reza telah mewawancarai puluhan kandidat engineer di perusahaannya.',
		faqs: [],
		sessionDurationMinutes: 60,
		meetingMethod: 'google_meet',
		views: 110,
		sales: 5,
		revenue: 1250000,
		buyClicks: 12,
		createdAt: '2026-08-15T09:00:00.000Z'
	},
	{
		id: 'prod_copyguide_anisa',
		sellerId: 'seller_anisa',
		title: 'Buku Panduan: 30 Rumus Copywriting Santai',
		slug: '30-rumus-copywriting-santai',
		type: 'digital',
		category: 'Copywriting',
		price: 35000,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		moderationStatus: 'approved',
		images: [
			'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80'
		],
		shortDescription:
			'Contoh nyata caption jualan Instagram dan WhatsApp tanpa terkesan memaksa pembeli.',
		targetAudience: 'Reseller, dropshipper, dan kreator kecil yang canggung jualan.',
		problemSolved: 'Tidak bingung lagi harus menulis apa saat memposting jualan di WhatsApp story.',
		whatYouGet: 'E-book PDF 42 halaman siap cetak atau dibaca di smartphone.',
		howItWorks: 'Download instan setelah transfer berhasil.',
		aboutCreator: 'Anisa telah menulis materi pemasaran untuk puluhan toko lokal di Bandung.',
		faqs: [],
		digitalDeliveryType: 'upload',
		fileDownloadName: '30-Rumus-Copywriting-Anisa.pdf',
		fileSize: '4.8 MB',
		views: 540,
		sales: 62,
		revenue: 2170000,
		buyClicks: 110,
		createdAt: '2026-04-10T12:00:00.000Z'
	},
	{
		id: 'prod_budget_hendra',
		sellerId: 'seller_hendra',
		title: 'Spreadsheet Keuangan Bulanan Rumah Tangga',
		slug: 'spreadsheet-keuangan-bulanan',
		type: 'digital',
		category: 'Keuangan',
		price: 45000,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		moderationStatus: 'approved',
		images: [
			'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
		],
		shortDescription:
			'File Google Sheets otomatis untuk mencatat pos belanja, dana darurat, dan cicilan bulanan.',
		targetAudience:
			'Pasangan baru menikah atau siapa saja yang ingin tahu ke mana uang gajinya mengalir.',
		problemSolved: 'Melihat ringkasan keuangan dalam grafik sederhana tanpa rumus rumit.',
		whatYouGet: 'Link master Google Sheets + video tutorial cara input pengeluaran lewat ponsel.',
		howItWorks: 'Salin template ke Google Drive pribadimu dengan satu klik.',
		aboutCreator: 'Hendra terbiasa mengolah data keuangan selama 8 tahun.',
		faqs: [],
		digitalDeliveryType: 'external_link',
		externalAccessUrl: 'https://docs.google.com/spreadsheets/d/sample-karja-hendra',
		views: 610,
		sales: 55,
		revenue: 2475000,
		buyClicks: 95,
		createdAt: '2026-05-01T07:30:00.000Z'
	},
	{
		id: 'prod_speaking_citra',
		sellerId: 'seller_citra',
		title: 'Sesi Bicara Tenang: Latihan Presentasi Tanpa Grogi',
		slug: 'sesi-bicara-tenang-latihan-presentasi',
		type: 'session',
		category: 'Komunikasi',
		price: 175000,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		moderationStatus: 'approved',
		images: [
			'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80'
		],
		shortDescription:
			'Latihan 45 menit one-on-one membawakan slide presentasimu dengan masukan ramah.',
		targetAudience: 'Karyawan yang harus presentasi di depan pimpinan atau klien minggu depan.',
		problemSolved:
			'Melatih pernapasan, intonasi, dan urutan pembukaan slide agar terdengar percaya diri.',
		whatYouGet: '45 menit latihan Google Meet + catatan perbaikan poin penting.',
		howItWorks: 'Jadwalkan waktu yang cocok di formulir pemesanan.',
		aboutCreator: 'Citra adalah mantan penyiar radio dan pelatih komunikasi pemula.',
		faqs: [],
		sessionDurationMinutes: 45,
		meetingMethod: 'google_meet',
		views: 95,
		sales: 4,
		revenue: 700000,
		buyClicks: 8,
		createdAt: '2026-07-20T10:00:00.000Z'
	}
];

// ============================================================================
// 4. Representative Orders (20 Platform Orders)
// ============================================================================
export const MOCK_ADMIN_ORDERS: Order[] = [
	{
		id: 'ord_kj_1001',
		orderNumber: 'KJ-0901',
		sellerId: 'seller_dimas',
		buyerName: 'Ahmad Fauzi',
		buyerEmail: 'fauzi.ahmad@gmail.com',
		buyerPhone: '08122334455',
		productId: 'prod_notion_dimas',
		productTitle: 'Template Notion Sistem Kerja Harian',
		productType: 'digital',
		amount: 49000,
		karjaFee: 3430, // 7%
		paymentFee: 980, // 2%
		netAmount: 44590, // 91%
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		createdAt: '2026-09-01T10:20:00.000Z'
	},
	{
		id: 'ord_kj_1002',
		orderNumber: 'KJ-0902',
		sellerId: 'seller_dimas',
		buyerName: 'Kartika Sari',
		buyerEmail: 'kartika.sari@yahoo.co.id',
		buyerPhone: '081377889900',
		productId: 'prod_mentoring_dimas',
		productTitle: 'Sesi 1-on-1: Tata Ulang Rutinitas Kerja',
		productType: 'session',
		amount: 150000,
		karjaFee: 10500,
		paymentFee: 3000,
		netAmount: 136500,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		scheduledDate: '2026-09-05',
		preferredTime: '19:00 WIB',
		createdAt: '2026-09-02T14:15:00.000Z'
	},
	{
		id: 'ord_kj_1003',
		orderNumber: 'KJ-0903',
		sellerId: 'seller_maya',
		buyerName: 'Bagus Wicaksono',
		buyerEmail: 'bagus.w@gmail.com',
		buyerPhone: '085611223344',
		productId: 'prod_brandkit_maya',
		productTitle: 'Figma Starter Kit: Palet Warna & Font Brand Lokal',
		productType: 'digital',
		amount: 75000,
		karjaFee: 5250,
		paymentFee: 1500,
		netAmount: 68250,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		createdAt: '2026-09-03T08:45:00.000Z'
	},
	{
		id: 'ord_kj_1004',
		orderNumber: 'KJ-0904',
		sellerId: 'seller_maya',
		buyerName: 'Ratna Dewi',
		buyerEmail: 'ratna.dewi.cafe@gmail.com',
		buyerPhone: '081299881122',
		productId: 'prod_audit_maya',
		productTitle: 'Audit Desain Logo & Feed Instagram UMKM',
		productType: 'service',
		amount: 199000,
		karjaFee: 13930,
		paymentFee: 3980,
		netAmount: 181090,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'hasil_dikirim',
		createdAt: '2026-09-04T11:30:00.000Z'
	},
	{
		id: 'ord_kj_1005',
		orderNumber: 'KJ-0905',
		sellerId: 'seller_reza',
		buyerName: 'Danang Saputra',
		buyerEmail: 'danang.dev@outlook.com',
		buyerPhone: '087812345678',
		productId: 'prod_resume_reza',
		productTitle: 'Review CV Software Engineer Lolos Screening',
		productType: 'service',
		amount: 120000,
		karjaFee: 8400,
		paymentFee: 2400,
		netAmount: 109200,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		createdAt: '2026-09-05T16:00:00.000Z'
	},
	{
		id: 'ord_kj_1006',
		orderNumber: 'KJ-0906',
		sellerId: 'seller_anisa',
		buyerName: 'Nurul Hidayah',
		buyerEmail: 'nurul.olshop@gmail.com',
		buyerPhone: '081355667788',
		productId: 'prod_copyguide_anisa',
		productTitle: 'Buku Panduan: 30 Rumus Copywriting Santai',
		productType: 'digital',
		amount: 35000,
		karjaFee: 2450,
		paymentFee: 700,
		netAmount: 31850,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		createdAt: '2026-09-06T09:10:00.000Z'
	},
	{
		id: 'ord_kj_1007',
		orderNumber: 'KJ-0907',
		sellerId: 'seller_hendra',
		buyerName: 'Tri Utomo',
		buyerEmail: 'tri.utomo@gmail.com',
		buyerPhone: '081234009988',
		productId: 'prod_budget_hendra',
		productTitle: 'Spreadsheet Keuangan Bulanan Rumah Tangga',
		productType: 'digital',
		amount: 45000,
		karjaFee: 3150,
		paymentFee: 900,
		netAmount: 40950,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		createdAt: '2026-09-07T13:40:00.000Z'
	},
	{
		id: 'ord_kj_1008',
		orderNumber: 'KJ-0908',
		sellerId: 'seller_citra',
		buyerName: 'Ferry Gunawan',
		buyerEmail: 'ferry.gunawan@perusahaan.co.id',
		buyerPhone: '081188776655',
		productId: 'prod_speaking_citra',
		productTitle: 'Sesi Bicara Tenang: Latihan Presentasi Tanpa Grogi',
		productType: 'session',
		amount: 175000,
		karjaFee: 12250,
		paymentFee: 3500,
		netAmount: 159250,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'terjadwal',
		scheduledDate: '2026-09-16',
		preferredTime: '20:00 WIB',
		createdAt: '2026-09-08T15:20:00.000Z'
	},
	{
		id: 'ord_kj_1009',
		orderNumber: 'KJ-0909',
		sellerId: 'seller_dimas',
		buyerName: 'Rudi Hartono',
		buyerEmail: 'rudi.h@gmail.com',
		buyerPhone: '082123456789',
		productId: 'prod_notion_dimas',
		productTitle: 'Template Notion Sistem Kerja Harian',
		productType: 'digital',
		amount: 49000,
		karjaFee: 3430,
		paymentFee: 980,
		netAmount: 44590,
		paymentStatus: 'menunggu_pembayaran',
		fulfillmentStatus: 'menunggu_brief',
		createdAt: '2026-09-09T18:00:00.000Z'
	},
	{
		id: 'ord_kj_1010',
		orderNumber: 'KJ-0910',
		sellerId: 'seller_reza',
		buyerName: 'Aldo Febrian',
		buyerEmail: 'aldo.febrian@binus.ac.id',
		buyerPhone: '089612349900',
		productId: 'prod_interview_reza',
		productTitle: 'Mock Interview Teknis Front-End / React',
		productType: 'session',
		amount: 250000,
		karjaFee: 17500,
		paymentFee: 5000,
		netAmount: 227500,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		createdAt: '2026-09-10T09:30:00.000Z'
	},
	{
		id: 'ord_kj_1011',
		orderNumber: 'KJ-0911',
		sellerId: 'seller_anisa',
		buyerName: 'Dewi Lestari',
		buyerEmail: 'dewi.lestari@gmail.com',
		buyerPhone: '085712349911',
		productId: 'prod_copyguide_anisa',
		productTitle: 'Buku Panduan: 30 Rumus Copywriting Santai',
		productType: 'digital',
		amount: 35000,
		karjaFee: 2450,
		paymentFee: 700,
		netAmount: 31850,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		createdAt: '2026-09-11T11:00:00.000Z'
	},
	{
		id: 'ord_kj_1012',
		orderNumber: 'KJ-0912',
		sellerId: 'seller_hendra',
		buyerName: 'Agus Pratama',
		buyerEmail: 'agus.pratama@gmail.com',
		buyerPhone: '081298761234',
		productId: 'prod_budget_hendra',
		productTitle: 'Spreadsheet Keuangan Bulanan Rumah Tangga',
		productType: 'digital',
		amount: 45000,
		karjaFee: 3150,
		paymentFee: 900,
		netAmount: 40950,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		createdAt: '2026-09-11T14:20:00.000Z'
	},
	{
		id: 'ord_kj_1013',
		orderNumber: 'KJ-0913',
		sellerId: 'seller_dimas',
		buyerName: 'Bayu Nugroho',
		buyerEmail: 'bayu.nugroho@gmail.com',
		buyerPhone: '081388997766',
		productId: 'prod_notion_dimas',
		productTitle: 'Template Notion Sistem Kerja Harian',
		productType: 'digital',
		amount: 49000,
		karjaFee: 3430,
		paymentFee: 980,
		netAmount: 44590,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		createdAt: '2026-09-12T07:15:00.000Z'
	},
	{
		id: 'ord_kj_1014',
		orderNumber: 'KJ-0914',
		sellerId: 'seller_maya',
		buyerName: 'Eka Putri',
		buyerEmail: 'eka.putri.studio@gmail.com',
		buyerPhone: '081233441199',
		productId: 'prod_brandkit_maya',
		productTitle: 'Figma Starter Kit: Palet Warna & Font Brand Lokal',
		productType: 'digital',
		amount: 75000,
		karjaFee: 5250,
		paymentFee: 1500,
		netAmount: 68250,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		createdAt: '2026-09-12T10:40:00.000Z'
	},
	{
		id: 'ord_kj_1015',
		orderNumber: 'KJ-0915',
		sellerId: 'seller_reza',
		buyerName: 'Gita Saraswati',
		buyerEmail: 'gita.saras@gmail.com',
		buyerPhone: '085699881122',
		productId: 'prod_resume_reza',
		productTitle: 'Review CV Software Engineer Lolos Screening',
		productType: 'service',
		amount: 120000,
		karjaFee: 8400,
		paymentFee: 2400,
		netAmount: 109200,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'sedang_dikerjakan',
		createdAt: '2026-09-13T09:00:00.000Z'
	}
];

// ============================================================================
// 5. Representative Payments
// ============================================================================
export const MOCK_ADMIN_PAYMENTS: Payment[] = [
	{
		id: 'pay_001',
		orderId: 'ord_kj_1001',
		sellerId: 'seller_dimas',
		buyerEmail: 'fauzi.ahmad@gmail.com',
		provider: 'qris',
		method: 'QRIS Gopay',
		providerReference: 'QRIS-ID-20260901-001',
		amount: 49000,
		status: 'paid',
		createdAt: '2026-09-01T10:20:00.000Z',
		paidAt: '2026-09-01T10:22:15.000Z'
	},
	{
		id: 'pay_002',
		orderId: 'ord_kj_1002',
		sellerId: 'seller_dimas',
		buyerEmail: 'kartika.sari@yahoo.co.id',
		provider: 'va',
		method: 'BCA Virtual Account',
		providerReference: 'VA-BCA-20260902-8819',
		amount: 150000,
		status: 'paid',
		createdAt: '2026-09-02T14:15:00.000Z',
		paidAt: '2026-09-02T14:19:00.000Z'
	},
	{
		id: 'pay_003',
		orderId: 'ord_kj_1003',
		sellerId: 'seller_maya',
		buyerEmail: 'bagus.w@gmail.com',
		provider: 'qris',
		method: 'QRIS ShopeePay',
		providerReference: 'QRIS-ID-20260903-5512',
		amount: 75000,
		status: 'paid',
		createdAt: '2026-09-03T08:45:00.000Z',
		paidAt: '2026-09-03T08:46:20.000Z'
	},
	{
		id: 'pay_004',
		orderId: 'ord_kj_1004',
		sellerId: 'seller_maya',
		buyerEmail: 'ratna.dewi.cafe@gmail.com',
		provider: 'va',
		method: 'Mandiri Virtual Account',
		providerReference: 'VA-MDR-20260904-1928',
		amount: 199000,
		status: 'paid',
		createdAt: '2026-09-04T11:30:00.000Z',
		paidAt: '2026-09-04T11:34:10.000Z'
	},
	{
		id: 'pay_005',
		orderId: 'ord_kj_1009',
		sellerId: 'seller_dimas',
		buyerEmail: 'rudi.h@gmail.com',
		provider: 'qris',
		method: 'QRIS BCA',
		providerReference: 'QRIS-ID-20260909-9941',
		amount: 49000,
		status: 'pending',
		createdAt: '2026-09-09T18:00:00.000Z',
		expiresAt: '2026-09-10T18:00:00.000Z'
	}
];

// ============================================================================
// 6. Representative Payouts (Across Payout Workflow Lifecycle)
// ============================================================================
export const MOCK_ADMIN_PAYOUTS: ExtendedPayout[] = [
	{
		id: 'payout_001',
		sellerId: 'seller_dimas',
		amount: 1500000,
		bankName: 'BCA',
		accountNumber: '8820394821',
		accountHolder: 'Dimas Prasetyo',
		status: 'paid',
		requestedAt: '2026-08-25T10:00:00.000Z',
		arrivalEstimate: '26 Agu 2026',
		referenceId: 'WD-20260825-01',
		reviewedAt: '2026-08-25T11:30:00.000Z',
		reviewedBy: 'Riana Safitri',
		processedAt: '2026-08-25T13:00:00.000Z',
		paidAt: '2026-08-25T14:15:00.000Z',
		providerReference: 'TRF-BCA-889912'
	},
	{
		id: 'payout_002',
		sellerId: 'seller_maya',
		amount: 1200000,
		bankName: 'Bank Mandiri',
		accountNumber: '1370019283746',
		accountHolder: 'Maya Indah Lestari',
		status: 'paid',
		requestedAt: '2026-08-28T09:00:00.000Z',
		arrivalEstimate: '29 Agu 2026',
		referenceId: 'WD-20260828-02',
		reviewedAt: '2026-08-28T10:00:00.000Z',
		reviewedBy: 'Riana Safitri',
		processedAt: '2026-08-28T11:00:00.000Z',
		paidAt: '2026-08-28T12:30:00.000Z',
		providerReference: 'TRF-MDR-992811'
	},
	{
		id: 'payout_003',
		sellerId: 'seller_hendra',
		amount: 850000,
		bankName: 'Bank BNI',
		accountNumber: '0892019482',
		accountHolder: 'Hendra Wijaya',
		status: 'processing',
		requestedAt: '2026-09-12T11:00:00.000Z',
		arrivalEstimate: '14 Sep 2026',
		referenceId: 'WD-20260912-03',
		reviewedAt: '2026-09-12T14:00:00.000Z',
		reviewedBy: 'Riana Safitri',
		processedAt: '2026-09-13T09:00:00.000Z'
	},
	{
		id: 'payout_004',
		sellerId: 'seller_anisa',
		amount: 500000,
		bankName: 'BCA',
		accountNumber: '5271928401',
		accountHolder: 'Anisa Kusuma',
		status: 'approved',
		requestedAt: '2026-09-13T08:30:00.000Z',
		arrivalEstimate: '15 Sep 2026',
		referenceId: 'WD-20260913-04',
		reviewedAt: '2026-09-13T10:15:00.000Z',
		reviewedBy: 'Riana Safitri'
	},
	{
		id: 'payout_005',
		sellerId: 'seller_reza',
		amount: 450000,
		bankName: 'BRI',
		accountNumber: '020601058392501',
		accountHolder: 'Reza Firmansyah',
		status: 'requested',
		requestedAt: '2026-09-13T16:00:00.000Z',
		arrivalEstimate: '15 Sep 2026',
		referenceId: 'WD-20260913-05'
	},
	{
		id: 'payout_006',
		sellerId: 'seller_citra',
		amount: 300000,
		bankName: 'BSI',
		accountNumber: '7192840192',
		accountHolder: 'Citra Permata',
		status: 'held',
		requestedAt: '2026-09-10T11:20:00.000Z',
		arrivalEstimate: 'Tertahan',
		referenceId: 'WD-20260910-06',
		reviewedAt: '2026-09-10T13:00:00.000Z',
		reviewedBy: 'Riana Safitri',
		holdReason: 'Akun seller belum melengkapi verifikasi identitas (KTP).'
	}
];

// ============================================================================
// 7. Trust & Safety: Reports & Disputes
// ============================================================================
export const MOCK_ADMIN_REPORTS: Report[] = [
	{
		id: 'rep_001',
		reporterType: 'buyer',
		reporterEmail: 'buyer.report@gmail.com',
		targetType: 'product',
		targetId: 'prod_notion_dimas',
		sellerId: 'seller_dimas',
		productId: 'prod_notion_dimas',
		reason: 'misleading_claim',
		message: 'Link duplikasi sempat meminta izin edit ke workspace pribadi pelapor.',
		status: 'reviewing',
		priority: 'normal',
		createdAt: '2026-09-11T13:20:00.000Z',
		reviewedBy: 'Riana Safitri'
	},
	{
		id: 'rep_002',
		reporterType: 'public',
		reporterEmail: 'halo@desainer.id',
		targetType: 'seller',
		targetId: 'seller_citra',
		sellerId: 'seller_citra',
		reason: 'scam',
		message: 'Akun menawarkan jasa tanpa informasi verifikasi identitas yang jelas.',
		status: 'open',
		priority: 'low',
		createdAt: '2026-09-12T09:10:00.000Z'
	}
];

export const MOCK_ADMIN_DISPUTES: Dispute[] = [
	{
		id: 'disp_001',
		orderId: 'ord_kj_1005',
		sellerId: 'seller_reza',
		productId: 'prod_resume_reza',
		buyerName: 'Danang Saputra',
		buyerEmail: 'danang.dev@outlook.com',
		reason: 'File hasil review terlambat lebih dari 24 jam dari janji timeline.',
		buyerStatement:
			'Saya memesan review 24 jam karena besok ada deadline lamaran kerja. Hasil baru dikirim 36 jam kemudian.',
		sellerResponse:
			'Mohon maaf, terjadi kendala koneksi internet di wilayah saya selama 8 jam kemarin.',
		status: 'admin_review',
		refundAmount: 60000,
		createdAt: '2026-09-08T10:00:00.000Z',
		sellerRespondedAt: '2026-09-08T14:30:00.000Z',
		reviewedBy: 'Riana Safitri'
	}
];

// ============================================================================
// 8. Financial Ledger Entries
// ============================================================================
export const MOCK_ADMIN_LEDGER: LedgerEntry[] = [
	{
		id: 'ledg_001',
		sellerId: 'seller_dimas',
		orderId: 'ord_kj_1001',
		paymentId: 'pay_001',
		type: 'sale',
		amount: 49000,
		grossAmount: 49000,
		karjaFee: 3430,
		paymentFee: 980,
		sellerNet: 44590,
		description: 'Penjualan Template Notion Sistem Kerja Harian (#KJ-0901)',
		createdAt: '2026-09-01T10:22:15.000Z'
	},
	{
		id: 'ledg_002',
		sellerId: 'seller_dimas',
		orderId: 'ord_kj_1002',
		paymentId: 'pay_002',
		type: 'sale',
		amount: 150000,
		grossAmount: 150000,
		karjaFee: 10500,
		paymentFee: 3000,
		sellerNet: 136500,
		description: 'Penjualan Sesi 1-on-1: Tata Ulang Rutinitas Kerja (#KJ-0902)',
		createdAt: '2026-09-02T14:19:00.000Z'
	},
	{
		id: 'ledg_003',
		sellerId: 'seller_maya',
		orderId: 'ord_kj_1003',
		paymentId: 'pay_003',
		type: 'sale',
		amount: 75000,
		grossAmount: 75000,
		karjaFee: 5250,
		paymentFee: 1500,
		sellerNet: 68250,
		description: 'Penjualan Figma Starter Kit Palet Warna (#KJ-0903)',
		createdAt: '2026-09-03T08:46:20.000Z'
	},
	{
		id: 'ledg_004',
		sellerId: 'seller_maya',
		orderId: 'ord_kj_1004',
		paymentId: 'pay_004',
		type: 'sale',
		amount: 199000,
		grossAmount: 199000,
		karjaFee: 13930,
		paymentFee: 3980,
		sellerNet: 181090,
		description: 'Penjualan Jasa Audit Desain Logo & Feed (#KJ-0904)',
		createdAt: '2026-09-04T11:34:10.000Z'
	},
	{
		id: 'ledg_005',
		sellerId: 'seller_dimas',
		payoutId: 'payout_001',
		type: 'payout',
		amount: 1500000,
		description: 'Penarikan saldo seller Dimas Prasetyo (WD-20260825-01)',
		createdAt: '2026-08-25T14:15:00.000Z'
	},
	{
		id: 'ledg_006',
		sellerId: 'seller_maya',
		payoutId: 'payout_002',
		type: 'payout',
		amount: 1200000,
		description: 'Penarikan saldo seller Maya Indah Lestari (WD-20260828-02)',
		createdAt: '2026-08-28T12:30:00.000Z'
	}
];

// ============================================================================
// 9. Audit Logs
// ============================================================================
export const MOCK_ADMIN_AUDIT_LOGS: AuditLog[] = [
	{
		id: 'audit_001',
		actorUserId: 'user_admin_riana',
		actorRole: 'admin',
		action: 'VERIFICATION_APPROVED',
		entityType: 'SellerProfile',
		entityId: 'seller_dimas',
		previousValue: { verificationStatus: 'pending' },
		newValue: { verificationStatus: 'verified' },
		reason: 'Dokumen KTP dan buku tabungan cocok 100%.',
		createdAt: '2026-04-02T14:30:00.000Z'
	},
	{
		id: 'audit_002',
		actorUserId: 'user_admin_riana',
		actorRole: 'admin',
		action: 'PAYOUT_APPROVED',
		entityType: 'Payout',
		entityId: 'payout_004',
		previousValue: { status: 'requested' },
		newValue: { status: 'approved' },
		reason: 'Pemeriksaan transaksi valid tanpa sengketa aktif.',
		createdAt: '2026-09-13T10:15:00.000Z'
	},
	{
		id: 'audit_003',
		actorUserId: 'user_admin_riana',
		actorRole: 'admin',
		action: 'PAYOUT_HELD',
		entityType: 'Payout',
		entityId: 'payout_006',
		previousValue: { status: 'requested' },
		newValue: { status: 'held' },
		reason: 'Akun seller belum melengkapi verifikasi identitas (KTP).',
		createdAt: '2026-09-10T13:00:00.000Z'
	}
];

// ============================================================================
// 10. Platform Blog Posts (CMS - Canonical BlogPost Model)
// ============================================================================
export const MOCK_ADMIN_BLOG_POSTS: BlogPost[] = INITIAL_BLOG_ARTICLES.map((art, idx) => ({
	...art,
	viewsCount: 2400 - idx * 160 + (idx % 2 === 0 ? 85 : 42),
	status: art.status || 'published'
}));

// ============================================================================
// 11. Initial Platform Settings
// ============================================================================
export const MOCK_ADMIN_SETTINGS: PlatformSettings = {
	karjaFeePercent: 7.0,
	paymentFeePercent: 2.0,
	minimumWithdrawalAmount: 100000,
	supportContact: {
		email: '',
		whatsapp: ''
	},
	socialLinks: {
		instagram: '',
		tiktok: '',
		x: ''
	},
	legalLinks: {
		terms: '/terms',
		privacy: '/privacy'
	},
	requireIdentityForPayout: true
};

// Aliases for compatibility
export { MOCK_ADMIN_FILES } from './mockFilesData';
export const initialMockFiles = MOCK_ADMIN_FILES;
export const initialAdminPlatformUsers = MOCK_ADMIN_USERS;
export const initialMockSellers = MOCK_ADMIN_SELLERS;
export const initialMockProducts = MOCK_ADMIN_PRODUCTS;
export const initialMockOrders = MOCK_ADMIN_ORDERS;
export const initialMockPayments = MOCK_ADMIN_PAYMENTS;
export const initialMockPayouts = MOCK_ADMIN_PAYOUTS;
export const initialMockReports = MOCK_ADMIN_REPORTS;
export const initialMockDisputes = MOCK_ADMIN_DISPUTES;
export const initialMockLedger = MOCK_ADMIN_LEDGER;
export const initialMockAuditLogs = MOCK_ADMIN_AUDIT_LOGS;
export const initialMockBlogPosts = MOCK_ADMIN_BLOG_POSTS;
export const initialPlatformSettings = MOCK_ADMIN_SETTINGS;
