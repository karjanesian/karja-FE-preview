import { BlogPost, BlogCategory } from '$lib/types/blog';

/**
 * Centralized curated editorial imagery.
 * Warm, believable, daylight photography focusing on practical working moments.
 */
export const BLOG_PLACEHOLDER_IMAGES = {
	featuredDesk:
		'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&auto=format&fit=crop&q=80',
	laptopNotes:
		'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900&auto=format&fit=crop&q=80',
	calculatorFinance:
		'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&auto=format&fit=crop&q=80',
	coffeeNotebook:
		'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=900&auto=format&fit=crop&q=80',
	friendlyChat:
		'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&auto=format&fit=crop&q=80',
	handsTyping:
		'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=900&auto=format&fit=crop&q=80',
	pricingSpreadsheet:
		'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&auto=format&fit=crop&q=80',
	phoneMessage:
		'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=900&auto=format&fit=crop&q=80',
	cozyStudio:
		'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&auto=format&fit=crop&q=80',
	boundaryWorkspace:
		'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=900&auto=format&fit=crop&q=80',
	kimmyPortrait:
		'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80',
	learningPivot:
		'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&auto=format&fit=crop&q=80'
};

export const BLOG_CATEGORIES: BlogCategory[] = [
	'Semua',
	'Mulai',
	'Produk Digital',
	'Sesi',
	'Layanan',
	'Jual & Bagikan',
	'Cerita Orang'
];

export const INITIAL_BLOG_ARTICLES: BlogPost[] = [
	{
		id: 'art-01',
		title: 'Kamu nggak harus punya ide bisnis. Mulai dari hal yang sering kamu bantu.',
		slug: 'mulai-dari-yang-sering-kamu-bantu',
		category: 'Mulai',
		excerpt:
			'Sebelum mikirin produk, coba lihat dulu: orang biasanya datang ke kamu buat minta bantuan soal apa?',
		readingTime: '7 menit baca',
		publishedAt: '13 September 2026',
		status: 'published',
		featured: true,
		coverImage: BLOG_PLACEHOLDER_IMAGES.featuredDesk,
		coverImageAlt: 'Meja kerja dengan buku catatan dan laptop dalam suasana tenang',
		author: {
			name: 'Tim Karja',
			role: 'Editorial'
		},
		seoTitle:
			'Kamu Nggak Harus Punya Ide Bisnis. Mulai dari Hal yang Sering Kamu Bantu — Blog Karja',
		metaDescription:
			'Sebelum mikirin produk atau ide bisnis rumit, coba lihat hal praktis yang sering diminta orang ke kamu. Mulai dari yang sudah ada.',
		content: [
			{
				type: 'paragraph',
				text: 'Banyak orang menunda membuat sesuatu karena merasa belum punya "ide bisnis yang tepat". Di kepala kita, produk harus terdengar revolusioner, punya rencana matang 5 tahun, atau butuh modal yang bikin ragu melangkah.'
			},
			{
				type: 'paragraph',
				text: 'Padahal kalau kita amati keseharian, orang-orang di sekitarmu jarang datang meminta ide bisnis besar. Mereka biasanya datang untuk hal-hal yang sangat spesifik dan praktis.'
			},
			{
				type: 'blockquote',
				quote:
					'Sebelum mikirin produk, coba lihat dulu: orang biasanya datang ke kamu buat minta bantuan soal apa?',
				author: 'Catatan Redaksi Karja'
			},
			{
				type: 'h2',
				text: 'Tiga pertanyaan sederhana untuk menoleh ke belakang'
			},
			{
				type: 'paragraph',
				text: 'Coba buka riwayat chat WhatsApp, DM Instagram, atau ingat percakapan makan siang minggu lalu:'
			},
			{
				type: 'bullet_list',
				items: [
					'File atau spreadsheet apa yang pernah diminta teman kantor: "Boleh minta template-nya nggak?"',
					'Pertanyaan apa yang paling sering bikin orang bilang: "Boleh nanya sebentar nggak, kamu biasanya gimana caranya?"',
					'Tugas apa yang buatmu selesai dalam 20 menit, tapi buat orang lain butuh waktu 3 hari dan bikin pusing?'
				]
			},
			{
				type: 'paragraph',
				text: 'Jawaban dari tiga pertanyaan itu bukan sekadar obrolan santai. Itu adalah sinyal paling jujur bahwa ada pengetahuan praktis yang sudah teruji nilainya di dunia nyata.'
			},
			{
				type: 'h2',
				text: 'Bentuk kecilnya dulu'
			},
			{
				type: 'paragraph',
				text: 'Ketika sudah menemukan satu hal yang sering kamu bantu, jangan langsung berpikir membuat kursus 12 bab atau agensi penuh waktu. Bikin versi paling rampingnya.'
			},
			{
				type: 'paragraph',
				text: 'Kalau itu file kerja yang rapi, rapikan kolomnya, beri catatan cara pakai, lalu jadikan satu file yang bisa langsung diunduh. Kalau itu penjelasan yang sering diulang, sediakan 30 menit sesi obrolan terstruktur.'
			},
			{
				type: 'callout',
				calloutTitle: 'Punya template yang kamu pakai sendiri?',
				calloutText:
					'Coba bikin versi yang bisa dibeli orang lain. Cukup rapikan sedikit dan beri panduan singkat.',
				calloutCtaLabel: 'Buat produk pertama →'
			},
			{
				type: 'h2',
				text: 'Tidak perlu izin siapa-siapa untuk mulai'
			},
			{
				type: 'paragraph',
				text: 'Kamu tidak perlu menunggu gelar baru, sertifikat tambahan, atau follower ribuan. Cukup satu hal yang jelas manfaatnya buat orang yang memang membutuhkannya.'
			},
			{
				type: 'paragraph',
				text: 'Dari situ, biarkan respon nyata yang membimbing langkah berikutnya. Dari nol, sampai ada.'
			}
		]
	},
	{
		id: 'art-02',
		title: '15 hal sederhana dari kerjaan sehari-hari yang bisa jadi produk',
		slug: '15-hal-sederhana-dari-kerjaan-sehari-hari',
		category: 'Mulai',
		excerpt:
			'Template laporan, checklist, SOP kecil, sampai cara kerja yang kamu pakai tiap minggu mungkin berguna buat orang lain.',
		readingTime: '8 menit baca',
		publishedAt: '12 September 2026',
		status: 'published',
		featured: false,
		coverImage: BLOG_PLACEHOLDER_IMAGES.laptopNotes,
		coverImageAlt: 'Catatan kerja dan laptop di meja',
		author: {
			name: 'Tim Karja',
			role: 'Editorial'
		},
		seoTitle: '15 Hal Sederhana dari Kerjaan Sehari-hari yang Bisa Jadi Produk — Blog Karja',
		metaDescription:
			'Temukan 15 contoh aset praktis dari rutinitas harianmu yang bisa langsung diubah menjadi produk bermanfaat.',
		content: [
			{
				type: 'paragraph',
				text: 'Sering kali kita menganggap apa yang kita kerjakan setiap hari itu "biasa saja" hanya karena kita sudah terbiasa melakukannya selama berbulan-bulan atau bertahun-tahun.'
			},
			{
				type: 'paragraph',
				text: 'Bagi orang baru yang baru masuk industri yang sama, atau pemilik usaha kecil yang harus mengurus semuanya sendirian, hal yang kamu anggap sepele itu bisa menghemat waktu berminggu-minggu.'
			},
			{
				type: 'h2',
				text: 'Contoh nyata yang bisa langsung kamu cek'
			},
			{
				type: 'bullet_list',
				items: [
					'Spreadsheet pembukuan kas kecil yang otomatis rekap bulanan.',
					'Checklist audit sebelum posting konten media sosial.',
					'Format surat penawaran harga (quotation) yang terbukti sering disetujui klien.',
					'SOP onboarding karyawan magang agar tidak perlu mengulang instruksi yang sama.',
					'Template slide presentasi pitching untuk laporan bulanan internal.',
					'Kumpulan formula Excel/Google Sheets untuk membersihkan data alamat dan nomor telepon.',
					'Panduan step-by-step mengurus perizinan OSS atau e-Faktur untuk UMKM pemula.',
					'Daftar vendor cetak, packaging, dan pengiriman terpercaya yang sudah kamu kurasi.'
				]
			},
			{
				type: 'blockquote',
				quote:
					'Nilai sebuah produk bukan dihitung dari berapa lama kamu membuatnya, tapi dari berapa jam waktu orang lain yang berhasil kamu hemat.',
				author: 'Prinsip Karja'
			},
			{
				type: 'paragraph',
				text: 'Coba buka folder laptopmu hari ini. Pilih satu file yang paling sering kamu pakai dan paling rapi. Jadikan itu titik awalmu.'
			}
		]
	},
	{
		id: 'art-03',
		title: 'Punya template kerja? Begini cara tahu apakah orang lain bakal membutuhkannya',
		slug: 'cara-tahu-template-kerja-dibutuhkan-orang-lain',
		category: 'Produk Digital',
		excerpt:
			'Nggak semua file harus dijual. Coba cek tiga hal ini dulu sebelum menjadikannya produk.',
		readingTime: '6 menit baca',
		publishedAt: '11 September 2026',
		status: 'published',
		featured: false,
		coverImage: BLOG_PLACEHOLDER_IMAGES.calculatorFinance,
		coverImageAlt: 'Kalkulator dan dokumen anggaran kerja',
		author: {
			name: 'Tim Karja',
			role: 'Editorial'
		},
		seoTitle: 'Punya Template Kerja? Begini Cara Tahu Apakah Orang Lain Butuh — Blog Karja',
		metaDescription:
			'Tiga kriteria sederhana untuk menyaring file kerja mana yang benar-benar siap dan layak dijadikan produk digital.',
		content: [
			{
				type: 'paragraph',
				text: 'Tidak semua spreadsheet atau dokumen di Google Drive kita harus dijadikan produk berbayar. Ada file yang sifatnya terlalu personal, ada juga yang terlalu spesifik hanya untuk satu perusahaan.'
			},
			{
				type: 'paragraph',
				text: 'Lalu bagaimana membedakan mana file yang sekadar arsip, dan mana yang benar-benar punya nilai untuk orang lain?'
			},
			{
				type: 'h2',
				text: '1. Apakah file itu menyelesaikan masalah berulang?'
			},
			{
				type: 'paragraph',
				text: 'File yang bagus biasanya menyelesaikan kerepotan yang terjadi berulang kali. Misalnya: hitung gaji bulanan, cek kelengkapan dokumen pajak, atau rekap invoice vendor.'
			},
			{
				type: 'h2',
				text: '2. Apakah orang lain bisa menggunakannya tanpa kamu dampingi?'
			},
			{
				type: 'paragraph',
				text: 'Uji sederhana: kirim file tersebut ke satu teman tanpa penjelasan lisan. Jika dalam 5 menit mereka bisa mengisi dan mengerti fungsinya, berarti file itu sudah matang.'
			},
			{
				type: 'h2',
				text: '3. Pernahkah ada yang meminta izin untuk meng-copy file tersebut?'
			},
			{
				type: 'paragraph',
				text: 'Ini adalah validasi paling kuat. Jika pernah ada rekan kerja atau teman komunitas yang meminta salinannya, kebutuhan itu nyata.'
			}
		]
	},
	{
		id: 'art-04',
		title: 'Produk digital nggak harus ebook: 12 contoh yang lebih sederhana',
		slug: 'produk-digital-nggak-harus-ebook',
		category: 'Produk Digital',
		excerpt:
			'Mulai dari sesuatu yang kecil, jelas, dan langsung membantu. Nggak harus bikin course panjang.',
		readingTime: '7 menit baca',
		publishedAt: '10 September 2026',
		status: 'published',
		featured: false,
		coverImage: BLOG_PLACEHOLDER_IMAGES.coffeeNotebook,
		coverImageAlt: 'Buku catatan kerja dan cangkir kopi',
		author: {
			name: 'Tim Karja',
			role: 'Editorial'
		},
		seoTitle: 'Produk Digital Nggak Harus Ebook: 12 Contoh yang Lebih Sederhana — Blog Karja',
		metaDescription:
			'Format produk digital yang lebih cepat dibuat, lebih mudah dipahami pembeli, dan langsung bisa diterapkan.',
		content: [
			{
				type: 'paragraph',
				text: 'Banyak orang mengira produk digital selalu berarti ebook 80 halaman atau rekaman kelas video berjam-jam. Anggapan ini sering kali justru membuat kita lelah sebelum sempat meluncurkan apa pun.'
			},
			{
				type: 'paragraph',
				text: 'Kenyataannya, orang masa kini lebih menyukai format yang ringkas, praktis, dan langsung menyelesaikan masalah mereka dalam hitungan menit.'
			},
			{
				type: 'h2',
				text: 'Format ringkas yang disukai pembeli'
			},
			{
				type: 'bullet_list',
				items: [
					'Checklist satu lembar PDF yang bisa dicetak dan dicentang fisik.',
					'Spreadsheet formula siap pakai dengan instruksi video layar 3 menit.',
					'Preset atau style warna untuk software editing yang menghemat waktu retouch.',
					'Bank prompt teruji untuk membantu menulis deskripsi produk jualan online.',
					'Template perjanjian kerja lepas (freelance agreement) berbahasa Indonesia yang jelas.',
					'Katalog supplier tangan pertama yang sudah terverifikasi kontak dan lokasinya.'
				]
			},
			{
				type: 'paragraph',
				text: 'Semakin sedikit waktu yang dibutuhkan pembeli untuk mendapatkan manfaat dari tokomu, semakin puas mereka dengan produkmu.'
			}
		]
	},
	{
		id: 'art-05',
		title: 'Sesi 30 menit bisa jadi produk. Ini cara membentuknya.',
		slug: 'sesi-30-menit-bisa-jadi-produk',
		category: 'Sesi',
		excerpt:
			'Kalau orang sering minta waktu buat ngobrol atau minta pendapatmu, mungkin yang mereka butuhkan memang sebuah sesi.',
		readingTime: '6 menit baca',
		publishedAt: '9 September 2026',
		status: 'published',
		featured: false,
		coverImage: BLOG_PLACEHOLDER_IMAGES.friendlyChat,
		coverImageAlt: 'Dua orang sedang berdiskusi hangat dengan laptop',
		author: {
			name: 'Tim Karja',
			role: 'Editorial'
		},
		seoTitle: 'Sesi 30 Menit Bisa Jadi Produk: Cara Membentuknya — Blog Karja',
		metaDescription:
			'Cara mengubah obrolan santai yang sering diminta orang menjadi sesi terstruktur dengan jadwal dan harga yang pantas.',
		content: [
			{
				type: 'paragraph',
				text: '"Boleh minta waktu 15 menit buat ngopi dan nanya-nanya?" Kalimat ini sering kita dengar. Awalnya terasa biasa saja, sampai akhirnya kalendermu penuh dengan obrolan tanpa arah yang menguras energimu.'
			},
			{
				type: 'paragraph',
				text: 'Membuka sesi berbayar bukan berarti kamu sombong atau pelit ilmu. Ini cara membuat batasan yang sehat agar orang yang benar-benar serius menghargai waktumu dan datang dengan persiapan matang.'
			},
			{
				type: 'h2',
				text: 'Kunci sesi 30 menit yang berhasil'
			},
			{
				type: 'bullet_list',
				items: [
					'Tentukan satu topik spesifik. Jangan buka sesi umum tentang "ngobrol karir", tapi "Review CV untuk posisi Junior Product Designer".',
					'Minta bahan pertanyaan sebelum sesi dimulai lewat formulir pemesanan.',
					'Bagi 30 menit menjadi: 5 menit klarifikasi, 20 menit bedah masalah, 5 menit aksi konkret.'
				]
			},
			{
				type: 'paragraph',
				text: 'Dengan batas waktu yang jelas, baik kamu maupun pembeli akan fokus memberikan dan mendapatkan hasil terbaik.'
			}
		]
	},
	{
		id: 'art-06',
		title: 'Jasa nggak harus jadi project besar. Coba bikin paket kecil dulu.',
		slug: 'jasa-nggak-harus-jadi-project-besar',
		category: 'Layanan',
		excerpt:
			'Bantuan yang jelas ruang lingkupnya lebih gampang dipahami, dihargai, dan dikerjakan.',
		readingTime: '6 menit baca',
		publishedAt: '8 September 2026',
		status: 'published',
		featured: false,
		coverImage: BLOG_PLACEHOLDER_IMAGES.handsTyping,
		coverImageAlt: 'Tangan sedang mengetik di keyboard dengan rapi',
		author: {
			name: 'Tim Karja',
			role: 'Editorial'
		},
		seoTitle: 'Jasa Nggak Harus Jadi Project Besar: Paket Kecil Dulu — Blog Karja',
		metaDescription:
			'Panduan mengemas keahlianmu menjadi paket layanan mikro dengan batas kerja (scope) yang jelas dan cepat tuntas.',
		content: [
			{
				type: 'paragraph',
				text: 'Menawarkan jasa sering kali menakutkan karena bayangan revisi tanpa akhir dan proses negosiasi berbelit-belit. Proyek besar memang melelahkan bagi freelancer pemula.'
			},
			{
				type: 'paragraph',
				text: 'Solusinya adalah memecah keahlianmu menjadi "layanan mikro" atau paket kecil dengan ruang lingkup (scope) yang tertutup rapi.'
			},
			{
				type: 'h2',
				text: 'Contoh paket kecil yang tegas'
			},
			{
				type: 'paragraph',
				text: 'Bandingkan dua penawaran ini:'
			},
			{
				type: 'bullet_list',
				items: [
					'Layanan A: "Jasa Pembuatan Website Lengkap" (luas, ambigu, rawan konflik).',
					'Layanan B: "Audit Kecepatan & Setup Keamanan 1 Website WordPress (Selesai 48 Jam)" (spesifik, jelas deliverable-nya, mudah dibayar).'
				]
			},
			{
				type: 'paragraph',
				text: 'Ketika pembeli tahu persis apa yang mereka dapatkan dan kapan selesainya, mereka tidak akan ragu menekan tombol beli.'
			}
		]
	},
	{
		id: 'art-07',
		title: 'Cara menentukan harga produk pertama tanpa kebanyakan mikir',
		slug: 'cara-menentukan-harga-produk-pertama',
		category: 'Jual & Bagikan',
		excerpt:
			'Harga pertama bukan keputusan seumur hidup. Yang penting cukup masuk akal untuk diuji.',
		readingTime: '8 menit baca',
		publishedAt: '7 September 2026',
		status: 'published',
		featured: false,
		coverImage: BLOG_PLACEHOLDER_IMAGES.pricingSpreadsheet,
		coverImageAlt: 'Grafik data sederhana dan spreadsheet',
		author: {
			name: 'Tim Karja',
			role: 'Editorial'
		},
		seoTitle: 'Cara Menentukan Harga Produk Pertama Tanpa Kebanyakan Mikir — Blog Karja',
		metaDescription:
			'Aturan praktis menentukan harga awal untuk produk digital, sesi, atau layanan pertamamu tanpa terjebak overthinking.',
		content: [
			{
				type: 'paragraph',
				text: 'Menentukan harga sering kali menjadi tempat paling lama di mana orang terhenti. Takut kemahalan, takut tidak ada yang beli, atau takut dianggap terlalu murah.'
			},
			{
				type: 'paragraph',
				text: 'Ingat satu hal penting: harga pertama bukan keputusan seumur hidup. Kamu bisa mengubahnya kapan saja setelah mendapat umpan balik dari 3 sampai 5 pembeli pertama.'
			},
			{
				type: 'h2',
				text: 'Rumus "Masuk Akal untuk Diuji"'
			},
			{
				type: 'bullet_list',
				items: [
					'Produk File/Template: Rp35.000 – Rp95.000. Setara harga 1-2 cangkir kopi kekinian. Tidak butuh rapat keluarga untuk membeli.',
					'Sesi Konsultasi 30-45 menit: Rp75.000 – Rp150.000 untuk awal. Cukup untuk menyaring orang yang berniat serius.',
					'Layanan Mikro: Rp150.000 – Rp350.000. Sangat terjangkau untuk tugas yang menghemat waktu kerja mereka seharian.'
				]
			},
			{
				type: 'blockquote',
				quote:
					'Tujuan harga pertama bukan mencari kekayaan instan, tapi memvalidasi bahwa apa yang kamu buat memang dihargai orang lain.',
				author: 'Prinsip Karja'
			}
		]
	},
	{
		id: 'art-08',
		title: 'Cara share link jualan tanpa merasa cringe',
		slug: 'cara-share-link-jualan-tanpa-cringe',
		category: 'Jual & Bagikan',
		excerpt:
			'Mulai dari orang yang memang pernah butuh bantuanmu. Nggak perlu tiba-tiba berubah jadi sales.',
		readingTime: '5 menit baca',
		publishedAt: '6 September 2026',
		status: 'published',
		featured: false,
		coverImage: BLOG_PLACEHOLDER_IMAGES.phoneMessage,
		coverImageAlt: 'Seseorang sedang mengirim pesan di ponsel',
		author: {
			name: 'Tim Karja',
			role: 'Editorial'
		},
		seoTitle: 'Cara Share Link Jualan Tanpa Merasa Cringe — Blog Karja',
		metaDescription:
			'Cara membagikan halaman tokomu secara natural, tulus, dan manusiawi tanpa terkesan spam atau hard selling.',
		content: [
			{
				type: 'paragraph',
				text: 'Banyak orang merasa canggung saat pertama kali membagikan link produknya. Rasanya seperti tiba-tiba berubah menjadi salesman yang agresif di grup keluarga atau linimasa teman.'
			},
			{
				type: 'paragraph',
				text: 'Rasa canggung itu muncul ketika kita merasa "sedang meminta uang orang". Padahal, niat aslimu adalah memberi tahu bahwa ada solusi siap pakai yang bisa mereka gunakan.'
			},
			{
				type: 'h2',
				text: 'Contoh kalimat yang tenang dan jujur'
			},
			{
				type: 'paragraph',
				text: 'Daripada menulis: "PROMO TERBATAS HARI INI SAJA GUYS!!", coba bagikan konteks di balik pembuatannya:'
			},
			{
				type: 'blockquote',
				quote:
					'"Kemarin ada beberapa teman yang nanya soal template laporan keuangan yang biasa aku pakai. Akhirnya aku rapikan dan taruh di sini biar gampang diunduh. Semoga berguna buat yang lagi ngerjain hal serupa: [link]"',
				author: 'Contoh Berbagi Alami'
			},
			{
				type: 'paragraph',
				text: 'Kalimat seperti ini terdengar bersahabat, menghargai ruang orang lain, dan tetap jelas tujuannya.'
			}
		]
	},
	{
		id: 'art-09',
		title: 'Nggak punya followers? Mulai dari orang yang pernah minta bantuanmu',
		slug: 'nggak-punya-followers-mulai-dari-orang-terdekat',
		category: 'Jual & Bagikan',
		excerpt:
			'Produk pertama nggak butuh ribuan orang. Kadang tiga orang yang tepat lebih berguna daripada seribu views.',
		readingTime: '5 menit baca',
		publishedAt: '5 September 2026',
		status: 'published',
		featured: false,
		coverImage: BLOG_PLACEHOLDER_IMAGES.cozyStudio,
		coverImageAlt: 'Suasana kerja kolaboratif yang akrab',
		author: {
			name: 'Tim Karja',
			role: 'Editorial'
		},
		seoTitle: 'Nggak Punya Followers? Mulai dari Orang Terdekat — Blog Karja',
		metaDescription:
			'Kenapa kamu tidak butuh audiens media sosial besar untuk mendapatkan transaksi pertamamu di Karja.',
		content: [
			{
				type: 'paragraph',
				text: 'Mitos paling merusak di era kreator saat ini adalah keyakinan bahwa kamu harus punya 10.000 pengikut dulu sebelum boleh menjual sesuatu.'
			},
			{
				type: 'paragraph',
				text: 'Kenyataannya, transaksi pertama hampir selalu datang dari lingkaran terdekat: mantan klien, rekan kerja di kantor lama, anggota grup komunitas, atau kenalan yang sudah tahu kapasitas kerjamu.'
			},
			{
				type: 'h2',
				text: 'Kekuatan tiga pembeli pertama'
			},
			{
				type: 'paragraph',
				text: 'Tiga orang pertama yang membeli produkmu akan memberikan tiga hal berharga:'
			},
			{
				type: 'bullet_list',
				items: [
					'Keyakinan psikologis bahwa tokomu benar-benar berfungsi dan menghasilkan.',
					'Masukan jujur tentang apa yang perlu diperbaiki dari file atau panduanmu.',
					'Rekomendasi dari mulut ke mulut yang jauh lebih dipercaya daripada iklan berbayar.'
				]
			},
			{
				type: 'paragraph',
				text: 'Fokuslah melayani 3 orang itu sebaik mungkin. Itu fondasi yang jauh lebih kokoh daripada angka metrik di profil sosial media.'
			}
		]
	},
	{
		id: 'art-10',
		title: 'Kenapa bantuan gratis kadang perlu punya batas',
		slug: 'kenapa-bantuan-gratis-perlu-punya-batas',
		category: 'Mulai',
		excerpt:
			'Membantu tetap bisa tulus tanpa membuat waktu dan kemampuanmu selalu dianggap gratis.',
		readingTime: '7 menit baca',
		publishedAt: '4 September 2026',
		status: 'published',
		featured: false,
		coverImage: BLOG_PLACEHOLDER_IMAGES.boundaryWorkspace,
		coverImageAlt: 'Meja kerja bersih dengan batas cahaya matahari',
		author: {
			name: 'Tim Karja',
			role: 'Editorial'
		},
		seoTitle: 'Kenapa Bantuan Gratis Kadang Perlu Punya Batas — Blog Karja',
		metaDescription:
			'Menemukan titik temu antara niat baik membantu sesama dan menjaga keberlanjutan energi serta waktumu.',
		content: [
			{
				type: 'paragraph',
				text: 'Membantu teman adalah hal baik. Kita semua pernah terbantu oleh kebaikan orang lain, dan kita tentu ingin membalasnya.'
			},
			{
				type: 'paragraph',
				text: 'Namun masalah muncul ketika bantuan yang awalnya 15 menit berubah menjadi pekerjaan paruh waktu tanpa kompensasi. Kamu mulai merasa lelah, pekerjaan utamamu terbengkalai, dan diam-diam timbul rasa kesal.'
			},
			{
				type: 'h2',
				text: 'Memberi harga adalah bentuk kejelasan'
			},
			{
				type: 'paragraph',
				text: 'Ketika kamu menyediakan link produk atau sesi berbayar, kamu memberikan batas yang jelas:'
			},
			{
				type: 'bullet_list',
				items: [
					'Orang yang hanya iseng atau mencari jalan pintas akan mundur dengan sendirinya.',
					'Orang yang benar-benar membutuhkan akan menghargai waktu dan komitmenmu.',
					'Kamu memiliki tanggung jawab penuh untuk memberikan kualitas terbaik karena ada transaksi resmi.'
				]
			},
			{
				type: 'paragraph',
				text: 'Batasan ini bukan memisahkanmu dari teman, melainkan menjaga agar hubungan pertemanan tetap sehat dan saling menghormati.'
			}
		]
	},
	{
		id: 'art-11',
		title: 'Kimmy awalnya cuma bikin checklist buat kerjaannya sendiri',
		slug: 'kimmy-awalnya-cuma-bikin-checklist',
		category: 'Cerita Orang',
		excerpt:
			'Dari satu checklist pajak, Kimmy sadar ada file, waktu, dan bantuan yang sebenarnya bisa punya bentuk sendiri.',
		readingTime: '6 menit baca',
		publishedAt: '3 September 2026',
		status: 'published',
		featured: false,
		coverImage: BLOG_PLACEHOLDER_IMAGES.kimmyPortrait,
		coverImageAlt: 'Potret hangat seorang pekerja profesional Indonesia yang tenang',
		author: {
			name: 'Tim Karja',
			role: 'Editorial'
		},
		seoTitle: 'Kimmy Awalnya Cuma Bikin Checklist Buat Kerjaan Sendiri — Blog Karja',
		metaDescription:
			'Cerita nyata bagaimana satu checklist administrasi sederhana berkembang menjadi tiga bentuk produk di Karja.',
		content: [
			{
				type: 'paragraph',
				text: 'Kimmy bekerja di bidang administrasi keuangan selama hampir empat tahun. Setiap akhir bulan, ia selalu menghadapi tumpukan dokumen yang bikin pusing jika ada satu hal kecil terlewat.'
			},
			{
				type: 'paragraph',
				text: 'Supaya tidak stres, Kimmy menyusun satu spreadsheet checklist sederhana: 18 langkah verifikasi invoice, pajak PPh, dan kelengkapan bukti potong. Spreadsheet itu murni ia buat untuk menyelamatkan dirinya sendiri.'
			},
			{
				type: 'h2',
				text: 'Dari satu file menjadi tiga bentuk'
			},
			{
				type: 'paragraph',
				text: 'Suatu hari, seorang teman sesama staf admin di perusahaan lain mengeluhkan hal yang sama. Kimmy membagikan file itu. Tanggapannya mengejutkan: "Gila Kim, ini ngebantu banget! Harusnya kamu jual ini."'
			},
			{
				type: 'paragraph',
				text: 'Di Karja, Kimmy kemudian menyadari bahwa satu keahlian ini bisa hadir dalam tiga bentuk yang berbeda:'
			},
			{
				type: 'bullet_list',
				items: [
					'Produk Digital: Template spreadsheet checklist verifikasi pajak bulanan (Rp49.000).',
					'Sesi: 30 menit tanya-jawab cara merapikan pembukuan pajak untuk toko online pemula (Rp99.000).',
					'Layanan: Bantuan audit cepat rekonsiliasi kas dan bukti potong 1 bulan (Rp250.000).'
				]
			},
			{
				type: 'blockquote',
				quote:
					'"Aku nggak pernah mikir mau jadi pengusaha. Aku cuma senang waktu tahu hal yang kubuat tiap malam ternyata bikin orang lain bisa pulang kantor tepat waktu."',
				author: 'Kimmy, Seller Karja'
			},
			{
				type: 'paragraph',
				text: 'Cerita Kimmy membuktikan bahwa kita tidak perlu mengubah diri menjadi sosok lain. Mulai saja dari apa yang sudah ada di tanganmu hari ini.'
			}
		]
	},
	{
		id: 'art-12',
		title: 'Produk pertama nggak laku. Terus ngapain?',
		slug: 'produk-pertama-nggak-laku-terus-ngapain',
		category: 'Mulai',
		excerpt:
			'Nggak ada pembelian bukan berarti semuanya gagal. Kadang kamu baru dapat informasi pertama.',
		readingTime: '7 menit baca',
		publishedAt: '2 September 2026',
		status: 'published',
		featured: false,
		coverImage: BLOG_PLACEHOLDER_IMAGES.learningPivot,
		coverImageAlt: 'Seseorang sedang mengevaluasi catatan di meja',
		author: {
			name: 'Tim Karja',
			role: 'Editorial'
		},
		seoTitle: 'Produk Pertama Nggak Laku. Terus Ngapain? — Blog Karja',
		metaDescription:
			'Langkah refleksi dan evaluasi yang tenang saat tokomu belum mendapat transaksi di minggu-minggu awal.',
		content: [
			{
				type: 'paragraph',
				text: 'Kamu sudah memberanikan diri merapikan file, membuat halaman produk di Karja, dan membagikan linknya. Lalu satu minggu berlalu, dan belum ada satu pun transaksi yang masuk.'
			},
			{
				type: 'paragraph',
				text: 'Reaksi pertama biasanya kecewa dan merasa bahwa keahlian kita tidak ada harganya. Ini perasaan yang sangat manusiawi, tapi kesimpulannya keliru.'
			},
			{
				type: 'h2',
				text: 'Bukan penolakan, tapi data awal'
			},
			{
				type: 'paragraph',
				text: 'Nol penjualan di awal biasanya bukan karena produkmu jelek, melainkan salah satu dari tiga hal ini:'
			},
			{
				type: 'bullet_list',
				items: [
					'Judulnya belum jelas: Apakah pembeli langsung paham apa yang mereka dapatkan dalam 3 detik pertama membaca judul?',
					'Orang yang melihat belum tepat: Apakah link itu sampai ke orang yang memang sedang punya masalah tersebut?',
					'Formatnya belum pas: Mungkin mereka tidak butuh membaca panduan, tapi lebih butuh mengobrol 15 menit lewat sesi langsung.'
				]
			},
			{
				type: 'paragraph',
				text: 'Lakukan satu perubahan kecil: ubah judulnya lebih spesifik, atau tanyakan langsung ke satu teman yang kamu percaya. Jadikan ini bagian dari proses. Dari nol, sampai ada.'
			}
		]
	}
];

// Helper functions
export function getArticleBySlug(slug: string): BlogPost | undefined {
	return INITIAL_BLOG_ARTICLES.find((article) => article.slug === slug);
}

export function getFeaturedArticle(): BlogPost {
	return INITIAL_BLOG_ARTICLES.find((article) => article.featured) || INITIAL_BLOG_ARTICLES[0];
}

export function getRelatedArticles(currentSlug: string, count: number = 3): BlogPost[] {
	const current = getArticleBySlug(currentSlug);
	const others = INITIAL_BLOG_ARTICLES.filter((a) => a.slug !== currentSlug);

	if (!current) return others.slice(0, count);

	// Match same category first
	const sameCategory = others.filter((a) => a.category === current.category);
	const differentCategory = others.filter((a) => a.category !== current.category);

	const combined = [...sameCategory, ...differentCategory];
	return combined.slice(0, count);
}

export function getCuratedStartingArticles(): BlogPost[] {
	const targetSlugs = [
		'cara-menentukan-harga-produk-pertama',
		'cara-share-link-jualan-tanpa-cringe',
		'nggak-punya-followers-mulai-dari-orang-terdekat'
	];
	return targetSlugs
		.map((slug) => INITIAL_BLOG_ARTICLES.find((a) => a.slug === slug))
		.filter((a): a is BlogPost => Boolean(a));
}
