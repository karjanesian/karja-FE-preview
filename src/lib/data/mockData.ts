import {
	Product,
	Order,
	Booking,
	Transaction,
	Payout,
	SellerProfile,
	AppNotification,
	LifecycleState,
	JourneySignals,
	Review,
	SellerVerification,
	NotificationPreferences,
	normalizeProductType
} from '$lib/types';
import { DEFAULT_SELLER_AVAILABILITY } from '$lib/domain/scheduling';
import {
	isOrderCompleted,
	needsSellerAction,
	findBookingForOrder
} from '$lib/domain/orderLifecycle';

export type { JourneySignals };

export const freshJourneySignals: JourneySignals = {
	hasSharedProduct: false,
	hasVisitedPublicStore: false,
	storeSetupCompleted: false
};

export const sampleJourneySignals: JourneySignals = {
	hasSharedProduct: true,
	hasVisitedPublicStore: true,
	storeSetupCompleted: true
};

export const initialJourneySignals: JourneySignals = freshJourneySignals;
export const initialLifecycleState: LifecycleState = 'no_product';

export const freshProducts: Product[] = [];
export const freshOrders: Order[] = [];
export const freshBookings: Booking[] = [];
export const freshTransactions: Transaction[] = [];
export const freshPayouts: Payout[] = [];
export const freshNotifications: AppNotification[] = [];
export const freshReviews: Review[] = [];

export const initialProducts: Product[] = freshProducts;
export const initialOrders: Order[] = freshOrders;
export const initialBookings: Booking[] = freshBookings;
export const initialTransactions: Transaction[] = freshTransactions;
export const initialPayouts: Payout[] = freshPayouts;
export const initialNotifications: AppNotification[] = freshNotifications;
export const initialReviews: Review[] = freshReviews;

export const freshSellerVerification: SellerVerification = {
	status: 'unverified',
	karjaVerifiedStatus: 'not_eligible'
};

export const sampleSellerVerification: SellerVerification = {
	status: 'verified',
	fullNameKtp: 'Daniel Gallego',
	nik: '3171021908920003',
	birthDate: '1992-08-19',
	ktpPhotoUrl:
		'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
	submittedAt: '14 Agu 2026',
	reviewedAt: '15 Agu 2026',
	reviewerNotes: 'Dokumen e-KTP valid. Identitas terverifikasi oleh Karja Admin.',
	verifiedAt: '15 Agu 2026',
	karjaVerifiedStatus: 'verified',
	karjaVerifiedAt: '20 Agu 2026'
};

export const identityOnlySellerVerification: SellerVerification = {
	status: 'verified',
	fullNameKtp: 'Budi Santoso',
	nik: '3201021503900002',
	birthDate: '1990-03-15',
	ktpPhotoUrl:
		'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
	submittedAt: '18 Agu 2026',
	reviewedAt: '19 Agu 2026',
	reviewerNotes: 'Dokumen e-KTP valid.',
	verifiedAt: '19 Agu 2026',
	karjaVerifiedStatus: 'not_eligible'
};

export const pendingSellerVerification: SellerVerification = {
	status: 'pending',
	fullNameKtp: 'Rian Pratama',
	nik: '3174021204950001',
	birthDate: '1995-04-12',
	ktpPhotoUrl:
		'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
	submittedAt: 'Hari ini, 09:30',
	karjaVerifiedStatus: 'not_eligible'
};

export const freshNotificationPreferences: NotificationPreferences = {
	email: {
		newOrder: true,
		orderActionRequired: true,
		sessionReminder: true,
		newReview: true,
		payoutUpdates: true,
		weeklySummary: false
	},
	inApp: {
		newOrder: true,
		orderActionRequired: true,
		sessionReminder: true,
		newReview: true,
		payoutUpdates: true
	}
};

export const sampleNotificationPreferences: NotificationPreferences = {
	email: {
		newOrder: true,
		orderActionRequired: true,
		sessionReminder: true,
		newReview: true,
		payoutUpdates: true,
		weeklySummary: true
	},
	inApp: {
		newOrder: true,
		orderActionRequired: true,
		sessionReminder: true,
		newReview: true,
		payoutUpdates: true
	}
};

export const freshSellerProfile: SellerProfile = {
	name: 'Teman Karja',
	username: '',
	email: '',
	tagline: '',
	bio: '',
	topics: [],
	whatsapp: '',
	instagram: '',
	linkedin: '',
	tiktok: '',
	threads: '',
	showWhatsappOnStore: false,
	avatarUrl: '',
	bannerUrl: '',
	bankInfo: {
		bank: '',
		accountNumber: '',
		accountHolder: ''
	},
	calendarIntegration: {
		provider: 'google_calendar',
		status: 'disconnected'
	},
	availability: undefined,
	verification: freshSellerVerification,
	notificationPreferences: freshNotificationPreferences
};

export const initialSellerProfile: SellerProfile = freshSellerProfile;

export const sampleSellerProfile: SellerProfile = {
	name: 'Daniel Gallego',
	username: 'danielgallego',
	email: 'daniel@example.com',
	tagline: 'Desainer Produk & Kreator Digital',
	bio: 'Hai! Aku membantu desainer, founder, dan kreator merapikan portofolio, review struktur UX/UI Figma, dan mentoring desain.',
	topics: ['Product Design', 'Review Figma', 'Design System', 'Mentoring UI/UX'],
	whatsapp: '081234567890',
	instagram: 'danielgallego.design',
	linkedin: 'danielgallego',
	tiktok: 'danielgallego',
	threads: 'danielgallego.design',
	showWhatsappOnStore: true,
	avatarUrl:
		'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
	bannerUrl:
		'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
	bankInfo: {
		bank: 'BCA (Bank Central Asia)',
		accountNumber: '8291039481',
		accountHolder: 'Daniel Gallego'
	},
	calendarIntegration: {
		provider: 'google_calendar',
		status: 'connected',
		connectedEmail: 'daniel@example.com',
		connectedAt: '2026-08-20'
	},
	availability: DEFAULT_SELLER_AVAILABILITY,
	verification: sampleSellerVerification,
	notificationPreferences: sampleNotificationPreferences
};

export const sampleReviews: Review[] = [
	{
		id: 'rev_1',
		orderId: 'ord_3',
		productId: 'prod_1',
		productTitle: 'Review Figma 20 Menit',
		buyerName: 'Putri Rahma',
		rating: 5,
		comment:
			'Feedback mas Daniel tajam dan to the point banget! Langsung nemu solusi untuk UX flow checkout yang sempat buntu.',
		isVerifiedPurchase: true,
		createdAt: '19 Agu 2026',
		sellerReply: {
			comment: 'Terima kasih banyak Putri! Sukses terus perbaikan flow UX-nya ya.',
			createdAt: '19 Agu 2026'
		}
	},
	{
		id: 'rev_2',
		orderId: 'ord_2',
		productId: 'prod_2',
		productTitle: 'Template Laporan Mingguan Excel Otomatis',
		buyerName: 'Rina Sasmita',
		rating: 5,
		comment:
			'Template sangat rapi, formula otomatisnya berjalan mulus tanpa error. Hemat 3 jam kerja tiap hari Jumat!',
		isVerifiedPurchase: true,
		createdAt: 'Kemarin',
		sellerReply: {
			comment:
				'Senang banget dengarnya Rina. Kalau ada rumus yang mau ditambah jangan ragu kabari ya!',
			createdAt: 'Kemarin'
		}
	},
	{
		id: 'rev_3',
		orderId: 'ord_4',
		productId: 'prod_3',
		productTitle: 'Audit & Masukan Profil LinkedIn',
		buyerName: 'Raka Aditya',
		rating: 5,
		comment:
			'Audit PDF-nya sangat detail dan actionable. Bagian optimasi keywords headline langsung aku implementasikan.',
		isVerifiedPurchase: true,
		createdAt: '18 Agu 2026',
		sellerReply: {
			comment: 'Sama-sama Raka! Semoga segera dipanggil interview di fintech impianmu ya.',
			createdAt: '19 Agu 2026'
		}
	}
];

export const sampleBookings: Booking[] = [
	{
		id: 'book_1',
		orderId: 'ord_1',
		productId: 'prod_1',
		productTitle: 'Review Figma 20 Menit',
		buyerName: 'Dion Pratama',
		buyerEmail: 'dion.pratama@outlook.com',
		buyerPhone: '081298765432',
		startAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
		endAt: new Date(Date.now() + 24 * 3600 * 1000 + 20 * 60 * 1000).toISOString(),
		dateFormatted: 'Besok, 19.30 WIB',
		timeFormatted: '19.30–19.50 WIB',
		timeSlot: '19:30',
		timezone: 'Asia/Jakarta',
		durationMinutes: 20,
		meetingMethod: 'google_meet',
		meetingUrl: 'https://meet.google.com/abc-defg-hij',
		status: 'confirmed',
		preparationAnswers: [
			{
				question: 'Apa yang ingin kamu bahas?',
				answer:
					'Aku ingin feedback untuk struktur dashboard Figma dan hierarchy typography sebelum pitch client.'
			},
			{
				question: 'Ada file atau link yang perlu aku lihat?',
				answer: 'https://figma.com/@dion/dashboard-concept-v1'
			}
		],
		createdAt: 'Hari ini, 14:02'
	}
];

export const sampleProducts: Product[] = [
	{
		id: 'prod_urban_harvest',
		title: 'Urban Harvest: Panduan Berkebun Organik di Rumah',
		slug: 'urban-harvest',
		type: 'digital',
		productSubtype: 'Ebook',
		category: 'Produk digital',
		price: 35000,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		images: [
			'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80',
			'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=1200&auto=format&fit=crop&q=80'
		],
		coverImage:
			'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80',
		coverEmoji: '🌱',
		badge: 'Ebook Pilihan',
		targetAudience:
			'Penghuni rumah perkotaan & pemula yang ingin mulai menanam sayuran organik di pekarangan terbatas atau balkon.',
		problemSolved:
			'Sering gagal menanam karena salah media tanam, bingung jadwal penyiraman, dan serangan hama perkotaan.',
		whatYouGet:
			'Ebook PDF 64 halaman Full Color, Cheatsheet Kalender Tanam Bulanan, dan Video Panduan Nutrisi Organik 15 menit.',
		howItWorks:
			'Akses download file PDF dan cheatsheet langsung terbuka otomatis segera setelah pembayaran lunas.',
		aboutCreator:
			'Praktisi urban farming mandiri dengan 6+ tahun pengalaman berkebun di lahan terbatas Jakarta Selatan.',
		faqs: [
			{
				id: 'faq_uh_1',
				question: 'Apakah cocok untuk pemula yang belum pernah berkebun?',
				answer:
					'Sangat cocok! Panduan dimulai dari pemilihan pot, campuran tanah dasar, hingga jenis sayuran yang paling tahan banting.'
			},
			{
				id: 'faq_uh_2',
				question: 'Bagaimana format file yang didapatkan?',
				answer:
					'File dalam format PDF berkualitas tinggi yang nyaman dibaca di smartphone, tablet, maupun laptop.'
			}
		],
		digitalDeliveryType: 'upload',
		fileDownloadName: 'Urban_Harvest_Ebook_Karja.pdf',
		fileSize: '14.2 MB',
		accessInstructions:
			'Download file langsung melalui layar konfirmasi atau link akses yang dikirimkan ke email.',
		views: 112,
		sales: 8,
		revenue: 280000,
		buyClicks: 14,
		createdAt: '2026-08-05'
	},
	{
		id: 'prod_ideation',
		title: 'Konsultasi Ideation',
		slug: 'konsultasi-ideation',
		type: 'session',
		productSubtype: 'Konsultasi',
		category: 'Sesi',
		price: 50000,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		images: [
			'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80'
		],
		coverEmoji: '💡',
		badge: 'Sesi Populer',
		targetAudience:
			'Kreator & profesional yang butuh sparring partner untuk merapikan ide awal produk atau layanan.',
		problemSolved:
			'Punya banyak ide tapi bingung mau mulai dari mana dan takut salah langkah saat eksekusi.',
		whatYouGet:
			'Sesi 1-on-1 selama 30 menit via Google Meet, bedah konsep produk, dan checklist aksi konkret.',
		howItWorks:
			'Pilih jadwal dan pesan sesi. Kita bahas bareng langkah paling realistis untuk produkmu.',
		aboutCreator: 'Membantu praktisi dan kreator merumuskan penawaran pertama yang bernilai nyata.',
		faqs: [
			{
				id: 'faq_id_1',
				question: 'Bagaimana alur setelah pembayaran?',
				answer:
					'Setelah pembayaran lunas, jadwal sesi akan disepakati bersama dan link pertemuan dikirimkan.'
			}
		],
		sessionDurationMinutes: 30,
		availabilityMode: 'seller_default',
		bufferMinutes: 10,
		minimumNoticeHours: 6,
		bookingWindowDays: 30,
		meetingMethod: 'google_meet',
		preparationQuestions: [
			'Apa ide produk/layanan yang ingin kamu bahas?',
			'Apa kendala terbesar yang sedang kamu hadapi?'
		],
		views: 3,
		buyClicks: 1,
		sales: 1,
		revenue: 50000,
		createdAt: '2026-08-20'
	},
	{
		id: 'prod_1',
		title: 'Review Figma 20 Menit',
		slug: 'review-figma-20-menit',
		type: 'session',
		productSubtype: 'Review',
		category: 'Sesi',
		price: 52500,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		images: [
			'https://images.unsplash.com/photo-1581291518655-9523c932edcf?w=1200&auto=format&fit=crop&q=80',
			'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'
		],
		coverEmoji: '🎨',
		badge: 'Paling diminati',
		targetAudience:
			'Product designer, UI/UX junior, dan founder yang ingin feedback tajam sebelum launch.',
		problemSolved:
			'Auto layout berantakan, hirarki visual rancu, atau alur prototipe membingungkan.',
		whatYouGet:
			'Sesi 1-on-1 via Google Meet selama 20 menit, live screen sharing bedah file Figma, dan ringkasan checklist action.',
		howItWorks:
			'Pilih jadwal langsung di kalender, isi pertanyaan persiapan, dan link Google Meet akan otomatis dibuat setelah transaksi selesai.',
		aboutCreator:
			'Senior Product Designer dengan 5+ tahun pengalaman membangun design system di tech company.',
		faqs: [
			{
				id: 'faq_1',
				question: 'Apakah link Google Meet dibuat otomatis?',
				answer:
					'Ya! Segera setelah pembayaran lunas, link Google Meet dan jadwal otomatis terkonfirmasi.'
			},
			{
				id: 'faq_2',
				question: 'Bagaimana kalau jadwal mendadak bentrok?',
				answer: 'Bisa reschedule dengan konfirmasi minimal 4 jam sebelum sesi dimulai.'
			}
		],
		sessionDurationMinutes: 20,
		availabilityMode: 'seller_default',
		bufferMinutes: 10,
		minimumNoticeHours: 6,
		bookingWindowDays: 30,
		meetingMethod: 'google_meet',
		preparationQuestions: [
			'Apa yang ingin kamu bahas?',
			'Ada file atau link yang perlu aku lihat?',
			'Apa hasil yang kamu harapkan setelah sesi?'
		],
		views: 142,
		sales: 4,
		revenue: 210000,
		buyClicks: 9,
		createdAt: '2026-08-10'
	},
	{
		id: 'prod_2',
		title: 'Template Laporan Mingguan Excel Otomatis',
		slug: 'template-laporan-mingguan-excel',
		type: 'digital',
		productSubtype: 'Template',
		category: 'Produk digital',
		price: 49000,
		priceMode: 'promo',
		regularPrice: 79000,
		promoPrice: 49000,
		visibility: 'store',
		status: 'active',
		images: [
			'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
			'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80'
		],
		coverEmoji: '📊',
		targetAudience:
			'Admin kantor, sekretaris, atau tim operasional yang lelah rekap data manual tiap Jumat.',
		problemSolved: 'Butuh berjam-jam bikin pivot table dan grafik laporan mingguan ke atasan.',
		whatYouGet:
			'File .xlsx siap pakai dengan dashboard visual dinamis, panduan video 5 menit, dan rumus otomatis.',
		howItWorks:
			'Download langsung setelah pembayaran lunas. Tinggal paste data mentah, grafik langsung update otomatis.',
		aboutCreator: 'Excel enthusiast yang suka bikin rumus rapi dan gampang dipahami pemula.',
		faqs: [
			{
				id: 'faq_3',
				question: 'Bisa dibuka di Google Sheets?',
				answer: 'Bisa! 100% kompatibel dengan Microsoft Excel 2016+ dan Google Sheets.'
			}
		],
		digitalDeliveryType: 'upload',
		fileDownloadName: 'Template_Laporan_Mingguan_Karja.xlsx',
		fileSize: '2.4 MB',
		accessInstructions:
			'Download file langsung melalui layar konfirmasi atau link akses yang dikirimkan.',
		views: 84,
		sales: 3,
		revenue: 147000,
		buyClicks: 5,
		createdAt: '2026-08-12'
	},
	{
		id: 'prod_3',
		title: 'Audit & Masukan Profil LinkedIn',
		slug: 'audit-profil-linkedin',
		type: 'service',
		productSubtype: 'Audit',
		category: 'Layanan',
		price: 120000,
		priceMode: 'fixed',
		visibility: 'store',
		status: 'active',
		images: [
			'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=1200&auto=format&fit=crop&q=80'
		],
		coverEmoji: '💼',
		targetAudience: 'Jobseeker yang ingin dilirik recruiter dan headhunter secara organik.',
		problemSolved: 'Profil LinkedIn sepi, headline membosankan, dan tidak muncul di pencarian HR.',
		whatYouGet:
			'Dokumen audit PDF 3 halaman berisi rekomendasi headline, summary, optimasi keyword skill, dan rekomendasi postingan pertama.',
		howItWorks: 'Kirim link profil LinkedIn kamu. Hasil audit dikirim via PDF dalam 2 hari kerja.',
		aboutCreator:
			'Telah membantu 150+ pencari kerja mendapatkan panggilan interview lewat LinkedIn.',
		faqs: [
			{
				id: 'faq_4',
				question: 'Berapa lama pengerjaannya?',
				answer: 'Maksimal 2 hari kerja setelah link profil dan target posisi diterima.'
			}
		],
		serviceTimelineDays: 2,
		serviceRevisions: 1,
		serviceDeliverables:
			'Laporan Audit PDF 3 halaman + rekomendasi perbaikan headline dan keywords.',
		serviceBuyerInputsRequired:
			'Link profil LinkedIn dan target posisi/industri yang ingin dilamar.',
		views: 42,
		sales: 1,
		revenue: 120000,
		buyClicks: 3,
		createdAt: '2026-08-15'
	}
];

export const sampleOrders: Order[] = [
	{
		id: 'ord_ideation',
		orderNumber: '#KRJ4868',
		buyerName: 'Dion Pratama',
		buyerEmail: 'dion.pratama@gmail.com',
		buyerPhone: '081234567890',
		productId: 'prod_ideation',
		productTitle: 'Konsultasi Ideation',
		productType: 'session',
		amount: 50000,
		karjaFee: 3500,
		paymentFee: 1000,
		netAmount: 45500,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'perlu_dijadwalkan',
		createdAt: 'Baru saja',
		buyerNotes: 'Halo, aku mau konsultasi ide validasi template dan mini workshop pertamaku.',
		preparationAnswers: [
			{
				question: 'Apa ide produk/layanan yang ingin kamu bahas?',
				answer: 'Aku mau bikin modul spreadsheet dan sesi 1-on-1 untuk freelancer pemula.'
			},
			{
				question: 'Apa kendala terbesar yang sedang kamu hadapi?',
				answer: 'Bingung nentuin harga awal dan cara nemuin pembeli pertama.'
			}
		]
	},
	{
		id: 'ord_1',
		orderNumber: '#KRJ1241',
		buyerName: 'Dion Pratama',
		buyerEmail: 'dion.pratama@outlook.com',
		buyerPhone: '081298765432',
		productId: 'prod_1',
		productTitle: 'Review Figma 20 Menit',
		productType: 'session',
		amount: 52500,
		karjaFee: 3675, // 7%
		paymentFee: 1050, // 2%
		netAmount: 47775,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'sudah_dijadwalkan',
		sessionConfirmationDeliveredAt: 'Hari ini, 14:02',
		createdAt: 'Hari ini, 14:02',
		bookingId: 'book_1',
		bookingDateFormatted: 'Besok, 19.30 WIB',
		bookingTimeFormatted: '19.30–19.50 WIB',
		bookingDurationMinutes: 20,
		meetingMethod: 'Google Meet',
		meetingLink: 'https://meet.google.com/abc-defg-hij',
		scheduledDate: 'Besok, 19.30 WIB (19.30–19.50 WIB)',
		buyerNotes:
			'Aku ingin feedback untuk struktur dashboard Figma dan hierarchy typography sebelum pitch client.',
		preparationAnswers: [
			{
				question: 'Apa yang ingin kamu bahas?',
				answer:
					'Aku ingin feedback untuk struktur dashboard Figma dan hierarchy typography sebelum pitch client.'
			},
			{
				question: 'Ada file atau link yang perlu aku lihat?',
				answer: 'https://figma.com/@dion/dashboard-concept-v1'
			}
		]
	},
	{
		id: 'ord_2',
		orderNumber: '#KRJ1240',
		buyerName: 'Rina Sasmita',
		buyerEmail: 'rina.sasmita@gmail.com',
		buyerPhone: '081399887766',
		productId: 'prod_2',
		productTitle: 'Template Laporan Mingguan Excel Otomatis',
		productType: 'digital',
		amount: 49000,
		karjaFee: 3430,
		paymentFee: 980,
		netAmount: 44590,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'akses_diberikan',
		createdAt: 'Kemarin, 19:15',
		buyerNotes: 'Terima kasih banyak template-nya sangat membantu!'
	},
	{
		id: 'ord_3',
		orderNumber: '#KRJ1239',
		buyerName: 'Putri Rahma',
		buyerEmail: 'putri.rahma@gmail.com',
		buyerPhone: '085711223344',
		productId: 'prod_1',
		productTitle: 'Review Figma 20 Menit',
		productType: 'session',
		amount: 52500,
		karjaFee: 3675,
		paymentFee: 1050,
		netAmount: 47775,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		createdAt: '18 Agu 2026',
		buyerNotes: 'Sudah selesai sesi konsultasi. Sangat puas dengan masukannya!',
		scheduledDate: '19 Agu 2026, 19:30 WIB',
		meetingMethod: 'Google Meet',
		meetingLink: 'https://meet.google.com/abc-defg-hij'
	},
	{
		id: 'ord_4',
		orderNumber: '#KRJ1238',
		buyerName: 'Raka Aditya',
		buyerEmail: 'raka.aditya@yahoo.com',
		buyerPhone: '081822334455',
		productId: 'prod_3',
		productTitle: 'Audit & Masukan Profil LinkedIn',
		productType: 'service',
		amount: 120000,
		karjaFee: 8400,
		paymentFee: 2400,
		netAmount: 109200,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'hasil_dikirim',
		createdAt: '17 Agu 2026',
		buyerNotes:
			'Target posisi: Product Manager di fintech. Link LinkedIn: linkedin.com/in/raka-aditya',
		serviceDelivery: {
			id: 'del_1',
			orderId: 'ord_4',
			method: 'upload',
			fileName: 'Audit_LinkedIn_Raka_Aditya_v1.pdf',
			fileSize: '1.8 MB',
			sellerMessage:
				'Hai Raka, ini hasil audit lengkap profil LinkedIn kamu beserta saran perbaikan headline dan keywords.',
			deliveredAt: '18 Agu 2026, 16:30 WIB'
		}
	},
	{
		id: 'ord_5',
		orderNumber: '#KRJ1237',
		buyerName: 'Hendra Wijaya',
		buyerEmail: 'hendra.wijaya@gmail.com',
		buyerPhone: '081733445566',
		productId: 'prod_urban_harvest',
		productTitle: 'Urban Harvest: Panduan Berkebun Organik di Rumah',
		productType: 'digital',
		amount: 35000,
		karjaFee: 2450,
		paymentFee: 700,
		netAmount: 31850,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'akses_diberikan',
		createdAt: '15 Agu 2026',
		buyerNotes: 'Ebook sangat praktis, langsung saya coba panduan menanam tomatnya.'
	},
	{
		id: 'ord_6',
		orderNumber: '#KRJ1236',
		buyerName: 'Sarah Wijaya',
		buyerEmail: 'sarah.w@gmail.com',
		buyerPhone: '081988776655',
		productId: 'prod_1',
		productTitle: 'Review Figma 20 Menit',
		productType: 'session',
		amount: 52500,
		karjaFee: 3675,
		paymentFee: 1050,
		netAmount: 47775,
		paymentStatus: 'lunas',
		fulfillmentStatus: 'selesai',
		createdAt: '12 Agu 2026',
		buyerNotes: 'Sesi mentoring sangat padat dan membuka wawasan. Terima kasih banyak!'
	}
];

export const sampleTransactions: Transaction[] = [
	{
		id: 'trx_1',
		date: 'Hari ini, 14:02',
		orderId: '#KRJ1241',
		productTitle: 'Review CV 30 Menit (Sarah Wijaya)',
		type: 'sale',
		amount: 75000,
		karjaFee: 5250,
		paymentFee: 1500,
		netReceived: 68250,
		status: 'siap'
	},
	{
		id: 'trx_2',
		date: 'Kemarin, 19:15',
		orderId: '#KRJ1240',
		productTitle: 'Template Laporan Mingguan Excel (Dion Pratama)',
		type: 'sale',
		amount: 49000,
		karjaFee: 3430,
		paymentFee: 980,
		netReceived: 44590,
		status: 'siap'
	},
	{
		id: 'trx_3',
		date: '18 Agu 2026',
		orderId: '#KRJ1239',
		productTitle: 'Review CV 30 Menit (Putri Rahma)',
		type: 'sale',
		amount: 75000,
		karjaFee: 5250,
		paymentFee: 1500,
		netReceived: 68250,
		status: 'siap'
	},
	{
		id: 'trx_4',
		date: '17 Agu 2026',
		orderId: '#KRJ1238',
		productTitle: 'Audit LinkedIn (Raka Aditya)',
		type: 'sale',
		amount: 120000,
		karjaFee: 8400,
		paymentFee: 2400,
		netReceived: 109200,
		status: 'proses'
	},
	{
		id: 'trx_5',
		date: '12 Agu 2026',
		productTitle: 'Penarikan uang ke Rekening BCA',
		type: 'payout',
		amount: 350000,
		karjaFee: 0,
		paymentFee: 0,
		netReceived: -350000,
		status: 'sukses'
	}
];

export const samplePayouts: Payout[] = [
	{
		id: 'pay_1',
		amount: 350000,
		bankName: 'BCA (Bank Central Asia)',
		accountNumber: '8291039481',
		accountHolder: 'Kimberly Tan',
		status: 'paid',
		requestedAt: '12 Agu 2026, 10:15 WIB',
		arrivalEstimate: 'Selesai dalam 15 menit',
		referenceId: 'WD-20260812-992'
	}
];

export const sampleNotifications: AppNotification[] = [
	{
		id: 'notif_1',
		title: 'Ada pembelian baru',
		description: 'Sarah Wijaya membeli Review CV 30 Menit seharga Rp75.000.',
		time: '14:02',
		unread: true,
		targetTab: 'pesanan',
		targetId: 'ord_1',
		type: 'sale'
	},
	{
		id: 'notif_2',
		title: 'Pesanan perlu tindakan',
		description: 'Sarah udah kirim waktu & kebutuhan. Cek dan atur jadwal sesinya.',
		time: '14:03',
		unread: true,
		targetTab: 'pesanan',
		targetId: 'ord_1',
		type: 'action'
	},
	{
		id: 'notif_3',
		title: 'Uangmu udah masuk',
		description: 'Rp68.250 udah masuk ke Uangmu.',
		time: '14:02',
		unread: true,
		targetTab: 'uangmu',
		type: 'money'
	},
	{
		id: 'notif_4',
		title: 'Ada yang melihat produkmu',
		description: '18 pengunjung baru melihat link produkmu dari WhatsApp.',
		time: '11:20',
		unread: true,
		targetTab: 'produk',
		targetId: 'prod_1',
		type: 'view'
	}
];

// Helper to derive lifecycle state based on actual data
export function deriveLifecycleState(
	products: Product[],
	orders: Order[],
	availableBalance: number,
	journeySignals: JourneySignals,
	bookings: Booking[] = []
): LifecycleState {
	if (!products || products.length === 0) {
		return 'no_product';
	}

	const activeProducts = products.filter((p) => p.status === 'active');
	const draftProducts = products.filter((p) => p.status === 'draft');

	if (activeProducts.length === 0 && draftProducts.length > 0) {
		return 'product_draft';
	}

	const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
	const paidOrders = orders.filter(
		(o) =>
			o.paymentStatus === 'lunas' &&
			!o.isFreeClaim &&
			o.amount > 0 &&
			o.fulfillmentStatus !== 'dibatalkan'
	);

	if (paidOrders.length === 0) {
		if (!journeySignals.hasSharedProduct) {
			return 'product_published_not_shared';
		}
		if (totalViews === 0) {
			return 'product_shared_no_views';
		}
		return 'first_views_no_sale';
	}

	// Check if any paid order requires operational seller action
	const hasActionNeeded = paidOrders.some((o) =>
		needsSellerAction(o, findBookingForOrder(o, bookings))
	);

	if (hasActionNeeded) {
		return 'first_sale_needs_action';
	}

	// If seller has exactly 1 paid order
	if (paidOrders.length === 1) {
		const singleOrder = paidOrders[0];
		if (isOrderCompleted(singleOrder)) {
			if (journeySignals.hasAcknowledgedFirstSaleMilestone && availableBalance > 0) {
				return 'balance_available';
			}
			return 'first_sale_completed';
		}
		// Active order (e.g. Session confirmed waiting for call date)
		if (availableBalance > 0) {
			return 'balance_available';
		}
		return 'repeat_seller';
	}

	if (availableBalance > 0) {
		return 'balance_available';
	}

	return 'repeat_seller';
}

// Helper to format Indonesian Rupiah currency
export const formatRupiah = (amount: number): string => {
	if (amount === 0) return 'Rp0';
	return 'Rp' + amount.toLocaleString('id-ID');
};

// Wizard Idea Presets & Contextual Logic
export interface WizardIdeaPreset {
	skillKeyword: string;
	targetAudienceSuggestions: string[];
	problemSuggestions: string[];
	suggestions: {
		digital: { title: string; price: number; description: string; subtype: string };
		session: { title: string; price: number; description: string; subtype: string };
		service: { title: string; price: number; description: string; subtype: string };
	};
}

export const wizardPresets: WizardIdeaPreset[] = [
	{
		skillKeyword: 'Bantu bikin CV & apply magang',
		targetAudienceSuggestions: [
			'Mahasiswa tingkat akhir & fresh graduate',
			'Pelamar magang & Management Trainee',
			'Jobseeker yang mau switch career',
			'Fresh graduate non-pengalaman'
		],
		problemSuggestions: [
			'Sering ditolak ATS dan bingung format CV yang rapi',
			'Bingung memilih poin pengalaman relevan',
			'CV terlalu panjang dan belum punya portofolio',
			'Belum tahu cara menulis bullet points hasil kerja'
		],
		suggestions: {
			digital: {
				title: 'Template CV ATS Magang + Panduan Pengisian',
				price: 35000,
				description:
					'File Word/Docs format standar ATS lengkap dengan contoh kata kerja aksi dan panduan per poin.',
				subtype: 'Template'
			},
			session: {
				title: 'Review CV 30 Menit',
				price: 75000,
				description:
					'Sesi live 30 menit lewat Google Meet untuk membedah CV, kata kunci ATS, dan tanya jawab langsung.',
				subtype: 'Review'
			},
			service: {
				title: 'Bedah & Tulis Ulang CV + Revisi 1x',
				price: 135000,
				description:
					'Kirim CV lamamu, terima dokumen hasil penulisan ulang profesional siap kirim dalam 2 hari.',
				subtype: 'Editing'
			}
		}
	},
	{
		skillKeyword: 'Bikin rumus & template Excel',
		targetAudienceSuggestions: [
			'Tim admin kantor & operasional',
			'Pemilik UMKM & online shop',
			'Tim finance & kasir',
			'Freelancer / virtual assistant',
			'Mahasiswa'
		],
		problemSuggestions: [
			'Rekap data masih manual dan laporan lama dibuat',
			'Rumus sering error dan pusing olah VLOOKUP',
			'Data tersebar di banyak file dan belum punya dashboard',
			'Butuh rekap kas masuk & keluar yang otomatis tiap Jumat'
		],
		suggestions: {
			digital: {
				title: 'Template Laporan Mingguan Excel Otomatis',
				price: 49000,
				description:
					'File spreadsheet siap pakai dengan rumus rekap otomatis dan dashboard visual ringkas.',
				subtype: 'Template'
			},
			session: {
				title: 'Troubleshooting Excel 30 Menit',
				price: 79000,
				description:
					'Bantu bereskan rumus yang bermasalah, rapikan tabel data, atau perbaiki formula lewat sesi live.',
				subtype: 'Konsultasi'
			},
			service: {
				title: 'Bantu Rapikan Dashboard Excel',
				price: 199000,
				description:
					'Kirimkan data mentah tokomu/kantormu, terima dashboard rapi dan formula otomatis dalam 2 hari kerja.',
				subtype: 'Setup'
			}
		}
	},
	{
		skillKeyword: 'Review desain & portfolio',
		targetAudienceSuggestions: [
			'Junior UI/UX designer & visual artist',
			'Mahasiswa jurusan desain grafis',
			'Freelancer desain pemula',
			'Creative yang mau melamar ke agensi / startup'
		],
		problemSuggestions: [
			'Portfolio sepi dan belum dilirik recruiter',
			'Bingung menyusun studi kasus UX yang meyakinkan',
			'Layout portfolio terlalu padat dan tidak fokus pada problem solving',
			'Ragu apakah standar visual desain sudah siap kerja'
		],
		suggestions: {
			digital: {
				title: 'Checklist Standar Portfolio UI/UX Siap Kerja',
				price: 29000,
				description:
					'Daftar cek esensial sebelum submit link portfolio ke lowongan, lengkap dengan struktur studi kasus.',
				subtype: 'Worksheet'
			},
			session: {
				title: 'Portfolio & Case Study Review 40 Menit',
				price: 95000,
				description:
					'Diskusi tatap muka untuk mengevaluasi studi kasus, hierarki visual, dan cerita di balik desainmu.',
				subtype: 'Review'
			},
			service: {
				title: 'Audit Tertulis Portfolio & Rekomendasi Redesign',
				price: 180000,
				description:
					'Laporan PDF evaluasi mendalam berisi catatan perbaikan per halaman proyek dan saran visual.',
				subtype: 'Audit'
			}
		}
	},
	{
		skillKeyword: 'Audit Instagram UMKM',
		targetAudienceSuggestions: [
			'Pemilik online shop & bisnis lokal',
			'Owner brand fashion & kuliner UMKM',
			'Content creator pemula',
			'Admin media sosial bisnis kecil'
		],
		problemSuggestions: [
			'Feed Instagram berantakan dan penjualan sepi',
			'Bingung menentukan ide konten harian dan format hook',
			'Followers tidak bertambah dan bio kurang menjelaskan produk',
			'Interaksi rendah dan postingan jarang diklik calon pembeli'
		],
		suggestions: {
			digital: {
				title: 'Panduan & Kalender Konten 30 Hari Instagram UMKM',
				price: 45000,
				description:
					'Template ide postingan, struktur caption siap copas, dan panduan visual sederhana.',
				subtype: 'Template'
			},
			session: {
				title: 'Sesi Audit Akun Instagram 45 Menit',
				price: 90000,
				description:
					'Bedah bio, highlight, konten, dan strategi promosi langsung lewat Google Meet.',
				subtype: 'Konsultasi'
			},
			service: {
				title: 'Audit Lengkap Profil & Rencana Konten Mingguan',
				price: 165000,
				description:
					'Laporan PDF evaluasi detail akun ditambah 7 konsep konten siap eksekusi sesuai produk tokomu.',
				subtype: 'Audit'
			}
		}
	},
	{
		skillKeyword: 'Tips interview kerja bahasa Inggris',
		targetAudienceSuggestions: [
			'Jobseeker yang melamar ke perusahaan multinasional / luar negeri',
			'Fresh graduate yang mempersiapkan user interview',
			'Karyawan yang mau promosi atau pindah kerja',
			'Mahasiswa yang apply exchange / beasiswa luar negeri'
		],
		problemSuggestions: [
			'Grogi saat interview dan jawaban bahasa Inggris kurang terstruktur',
			'Bingung menjawab pertanyaan behavioral seperti Tell Me About Yourself',
			'Kosakata terbatas dan sering blank saat menjawab pertanyaan sulit',
			'Kurang percaya diri dengan pelafalan dan alur penjelasan pengalaman'
		],
		suggestions: {
			digital: {
				title: 'Cheat Sheet 50 Pertanyaan Interview Bahasa Inggris + Formula Jawaban',
				price: 39000,
				description: 'Ebook PDF ringkas dengan contoh jawaban model STAR siap latihan mandiri.',
				subtype: 'Ebook'
			},
			session: {
				title: 'Simulasi Mock Interview English 30 Menit + Feedback',
				price: 85000,
				description:
					'Latihan tatap muka langsung via Google Meet dengan masukan grammar, pilihan kata, & confidence.',
				subtype: 'Mentoring'
			},
			service: {
				title: 'Review Script Perkenalan & Jawaban Behavioral Interview',
				price: 120000,
				description:
					'Kirim draf jawabanmu, aku koreksi pilihan kata dan alurnya agar lebih profesional & meyakinkan.',
				subtype: 'Review'
			}
		}
	}
];

// Helper to get dynamic contextual suggestions for Step 2 based on Step 1
export function getContextualAudiences(skill: string): string[] {
	const cleanSkill = skill.toLowerCase().trim();
	const matched = wizardPresets.find(
		(p) =>
			p.skillKeyword.toLowerCase().includes(cleanSkill) ||
			cleanSkill.includes(p.skillKeyword.toLowerCase().slice(0, 10))
	);
	if (matched) return matched.targetAudienceSuggestions;

	if (cleanSkill.includes('excel') || cleanSkill.includes('data') || cleanSkill.includes('sheet')) {
		return [
			'Tim admin & operasional kantor',
			'Pemilik UMKM & online shop',
			'Tim finance & kasir',
			'Freelancer / virtual assistant',
			'Mahasiswa'
		];
	}
	if (
		cleanSkill.includes('cv') ||
		cleanSkill.includes('karir') ||
		cleanSkill.includes('kerja') ||
		cleanSkill.includes('interview')
	) {
		return [
			'Mahasiswa tingkat akhir & fresh graduate',
			'Jobseeker yang mau switch career',
			'Pelamar magang & Management Trainee',
			'Karyawan yang mau promosi posisi'
		];
	}
	if (
		cleanSkill.includes('desain') ||
		cleanSkill.includes('design') ||
		cleanSkill.includes('portfolio') ||
		cleanSkill.includes('ui')
	) {
		return [
			'Junior UI/UX designer & visual artist',
			'Mahasiswa jurusan desain grafis',
			'Creative freelancer pemula',
			'Jobseeker di industri kreatif'
		];
	}
	if (
		cleanSkill.includes('instagram') ||
		cleanSkill.includes('konten') ||
		cleanSkill.includes('sosmed') ||
		cleanSkill.includes('marketing')
	) {
		return [
			'Pemilik UMKM & online shop',
			'Content creator pemula',
			'Owner brand lokal',
			'Admin media sosial bisnis kecil'
		];
	}

	return [
		'Pemula yang baru mulai belajar',
		'Pemilik bisnis kecil & UMKM',
		'Mahasiswa & fresh graduate',
		'Freelancer yang butuh bantuan praktis',
		'Tim operasional atau admin'
	];
}

// Helper to get dynamic contextual suggestions for Step 3 based on Step 1 & 2
export function getContextualProblems(skill: string, audience: string): string[] {
	const cleanSkill = skill.toLowerCase().trim();
	const matched = wizardPresets.find(
		(p) =>
			p.skillKeyword.toLowerCase().includes(cleanSkill) ||
			cleanSkill.includes(p.skillKeyword.toLowerCase().slice(0, 10))
	);
	if (matched) return matched.problemSuggestions;

	if (cleanSkill.includes('excel') || cleanSkill.includes('data') || cleanSkill.includes('sheet')) {
		return [
			'Rekap data masih manual dan laporan lama dibuat',
			'Rumus sering error dan pusing olah formula',
			'Data tersebar di banyak file dan belum punya dashboard',
			'Belum punya template otomatis untuk rekap mingguan'
		];
	}
	if (cleanSkill.includes('cv') || cleanSkill.includes('karir') || cleanSkill.includes('kerja')) {
		return [
			'Sering ditolak ATS dan bingung format yang rapi',
			'Bingung memilih poin pengalaman relevan',
			'CV terlalu panjang dan belum punya portofolio pendukung',
			'Belum tahu cara menulis bullet points hasil kerja'
		];
	}
	if (cleanSkill.includes('instagram') || cleanSkill.includes('sosmed')) {
		return [
			'Feed Instagram berantakan dan penjualan sepi',
			'Bingung menentukan ide konten harian dan hook',
			'Bio kurang jelas dan followers jarang berinteraksi',
			'Pusing mengatur jadwal posting yang konsisten'
		];
	}

	return [
		`Pusing mengerjakan hal ini secara manual dan butuh cara lebih cepat`,
		`Bingung harus mulai dari mana dan takut salah langkah`,
		`Butuh panduan atau template siap pakai yang rapi`,
		`Ingin masukan langsung dari orang yang sudah berpengalaman`
	];
}

// Helper to generate contextual recommendations from current skill + audience + problem
export function generateDynamicWizardIdeas(
	skill: string,
	audience: string,
	problem: string
): WizardIdeaPreset['suggestions'] {
	const cleanSkill = skill.trim();
	const matched = wizardPresets.find(
		(p) => p.skillKeyword.toLowerCase() === cleanSkill.toLowerCase()
	);

	if (matched && !audience && !problem) {
		return matched.suggestions;
	}

	// Derive short clean skill for title formulation
	let shortSkill = cleanSkill;
	if (shortSkill.toLowerCase().startsWith('bantu ')) shortSkill = shortSkill.slice(6);
	if (shortSkill.toLowerCase().startsWith('bikin ')) shortSkill = shortSkill.slice(6);
	if (shortSkill.length > 28) shortSkill = shortSkill.slice(0, 26) + '...';

	const cleanAudience = audience.trim() || 'pembeli';

	return {
		digital: {
			title: `Template & Panduan ${shortSkill}`,
			price: 49000,
			description: `Template & panduan siap pakai untuk membantu ${cleanAudience}.`,
			subtype: 'Template'
		},
		session: {
			title: `Sesi Diskusi & Solusi ${shortSkill} (30 Menit)`,
			price: 79000,
			description: `Sesi tatap muka 1-on-1 via Google Meet untuk tanya jawab dan solusi langsung.`,
			subtype: 'Konsultasi'
		},
		service: {
			title: `Bantu Pengerjaan ${shortSkill}`,
			price: 189000,
			description: `Pengerjaan dan hasil rapi sesuai brief kebutuhan dalam 2-3 hari kerja.`,
			subtype: 'Layanan'
		}
	};
}
