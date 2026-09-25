/**
 * KARJA FILE ASSET & STORAGE UTILITIES (v1.5.4)
 * Canonical formatters, calculations, permissions, and aggregators for FileAsset domain.
 */

import {
	FileAsset,
	FileAssetCategory,
	FileAccessLevel,
	StorageCapacityConfig,
	DEFAULT_STORAGE_CAPACITY_CONFIG,
	StorageCategoryBreakdown,
	SellerStorageSummary,
	StorageOverviewMetrics
} from '$lib/types/fileAsset';
import { Product, Order, SellerProfile } from '$lib/types';

/**
 * Canonical byte formatter across Karja Admin & Public interfaces.
 * Outputs: "482 B", "14.2 KB", "4.8 MB", "1.2 GB", "23.8 GB".
 */
export function formatBytes(bytes: number, decimals = 1): string {
	if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const clampedIndex = Math.min(i, sizes.length - 1);
	const value = bytes / Math.pow(k, clampedIndex);

	// If exact whole integer at standard units, omit decimal (e.g. 5 MB rather than 5.0 MB)
	const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(dm);
	return `${formatted} ${sizes[clampedIndex]}`;
}

/**
 * Human-friendly category labels in Karja tone.
 */
export function getCategoryLabel(category: FileAssetCategory): string {
	switch (category) {
		case 'product_file':
			return 'File Produk Digital';
		case 'product_image':
			return 'Foto Produk';
		case 'service_buyer_input':
			return 'File Brief Pembeli';
		case 'service_delivery':
			return 'File Delivery Layanan';
		case 'verification_document':
			return 'Dokumen e-KTP (Restricted)';
		case 'blog_asset':
			return 'Aset Editorial Blog';
		case 'store_asset':
			return 'Aset Toko (Avatar/Banner)';
		case 'other':
		default:
			return 'Lainnya';
	}
}

/**
 * Category badge styles.
 */
export function getCategoryBadgeStyle(category: FileAssetCategory): {
	bg: string;
	text: string;
	border: string;
} {
	switch (category) {
		case 'product_file':
			return { bg: 'bg-[#EBF5F0]', text: 'text-[#0C7B58]', border: 'border-[#CCE6D6]' };
		case 'product_image':
			return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
		case 'service_buyer_input':
			return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
		case 'service_delivery':
			return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
		case 'verification_document':
			return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
		case 'blog_asset':
			return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
		case 'store_asset':
			return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
		case 'other':
		default:
			return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
	}
}

/**
 * Calculate active non-deleted storage consumption in bytes.
 */
export function getStorageUsedBytes(files: FileAsset[]): number {
	if (!Array.isArray(files)) return 0;
	return files
		.filter((f) => f.status !== 'deleted' && f.status !== 'failed')
		.reduce((sum, f) => sum + (Number(f.sizeBytes) || 0), 0);
}

/**
 * Calculate available free storage in bytes against configured capacity.
 */
export function getStorageAvailableBytes(
	files: FileAsset[],
	capacityBytes: number = DEFAULT_STORAGE_CAPACITY_CONFIG.capacityBytes
): number {
	const used = getStorageUsedBytes(files);
	return Math.max(0, capacityBytes - used);
}

/**
 * Calculate storage percentage used (0 - 100).
 */
export function getStorageUsagePercent(
	files: FileAsset[],
	capacityBytes: number = DEFAULT_STORAGE_CAPACITY_CONFIG.capacityBytes
): number {
	if (!capacityBytes || capacityBytes <= 0) return 0;
	const used = getStorageUsedBytes(files);
	const percent = (used / capacityBytes) * 100;
	return Math.min(100, Math.round(percent * 10) / 10);
}

/**
 * Aggregate active storage grouped by canonical categories.
 */
export function getStorageByCategory(files: FileAsset[]): StorageCategoryBreakdown[] {
	const activeFiles = (files || []).filter((f) => f.status !== 'deleted');
	const totalUsed = getStorageUsedBytes(files);

	const categories: FileAssetCategory[] = [
		'product_file',
		'service_delivery',
		'service_buyer_input',
		'product_image',
		'verification_document',
		'blog_asset',
		'store_asset',
		'other'
	];

	const map = new Map<FileAssetCategory, { bytes: number; count: number }>();
	for (const cat of categories) {
		map.set(cat, { bytes: 0, count: 0 });
	}

	for (const file of activeFiles) {
		const cat = map.has(file.category) ? file.category : 'other';
		const entry = map.get(cat)!;
		if (file.status !== 'failed') {
			entry.bytes += Number(file.sizeBytes) || 0;
		}
		entry.count += 1;
	}

	return categories
		.map((cat) => {
			const entry = map.get(cat)!;
			const percentage = totalUsed > 0 ? Math.round((entry.bytes / totalUsed) * 1000) / 10 : 0;
			return {
				category: cat,
				label: getCategoryLabel(cat),
				totalBytes: entry.bytes,
				fileCount: entry.count,
				percentage
			};
		})
		.filter((c) => c.fileCount > 0 || c.totalBytes > 0);
}

/**
 * Group and calculate storage consumption for a specific seller.
 */
export function getStorageBySeller(
	files: FileAsset[],
	sellerIdOrUsername: string
): SellerStorageSummary {
	if (!sellerIdOrUsername) {
		return {
			sellerId: '',
			totalBytes: 0,
			fileCount: 0,
			digitalBytes: 0,
			serviceBytes: 0,
			imageBytes: 0,
			otherBytes: 0
		};
	}

	const sellerClean = sellerIdOrUsername
		.toLowerCase()
		.replace(/^seller_/, '')
		.replace(/^@/, '');

	const sellerFiles = (files || []).filter((f) => {
		if (f.status === 'deleted') return false;
		if (!f.ownerSellerId) return false;
		const fOwnerClean = f.ownerSellerId
			.toLowerCase()
			.replace(/^seller_/, '')
			.replace(/^@/, '');
		return fOwnerClean === sellerClean || f.ownerSellerId === sellerIdOrUsername;
	});

	let digitalBytes = 0;
	let serviceBytes = 0;
	let imageBytes = 0;
	let otherBytes = 0;

	for (const f of sellerFiles) {
		const bytes = Number(f.sizeBytes) || 0;
		if (f.category === 'product_file') {
			digitalBytes += bytes;
		} else if (f.category === 'service_delivery' || f.category === 'service_buyer_input') {
			serviceBytes += bytes;
		} else if (f.category === 'product_image' || f.category === 'store_asset') {
			imageBytes += bytes;
		} else {
			otherBytes += bytes;
		}
	}

	const totalBytes = digitalBytes + serviceBytes + imageBytes + otherBytes;

	return {
		sellerId: sellerIdOrUsername,
		totalBytes,
		fileCount: sellerFiles.length,
		digitalBytes,
		serviceBytes,
		imageBytes,
		otherBytes
	};
}

/**
 * Get storage footprint for a specific product and its related order deliveries.
 */
export function getStorageByProduct(files: FileAsset[], productId: string) {
	const directAssets = (files || []).filter(
		(f) =>
			f.status !== 'deleted' && f.linkedEntityType === 'product' && f.linkedEntityId === productId
	);

	const productAssetsBytes = directAssets.reduce((sum, f) => sum + (Number(f.sizeBytes) || 0), 0);

	return {
		productAssetsBytes,
		totalBytes: productAssetsBytes,
		fileCount: directAssets.length,
		files: directAssets
	};
}

/**
 * Get storage for a specific service order (buyer brief upload vs seller delivery).
 */
export function getStorageByOrder(files: FileAsset[], orderId: string) {
	const orderFiles = (files || []).filter(
		(f) => f.status !== 'deleted' && f.linkedEntityType === 'order' && f.linkedEntityId === orderId
	);

	const buyerFiles = orderFiles.filter((f) => f.category === 'service_buyer_input');
	const deliveryFiles = orderFiles.filter((f) => f.category === 'service_delivery');

	const buyerInputBytes = buyerFiles.reduce((sum, f) => sum + (Number(f.sizeBytes) || 0), 0);
	const sellerDeliveryBytes = deliveryFiles.reduce((sum, f) => sum + (Number(f.sizeBytes) || 0), 0);

	return {
		buyerInputBytes,
		sellerDeliveryBytes,
		totalBytes: buyerInputBytes + sellerDeliveryBytes,
		buyerFiles,
		deliveryFiles,
		allFiles: orderFiles
	};
}

/**
 * Comprehensive overview metrics calculation.
 */
export function getStorageOverviewMetrics(
	files: FileAsset[],
	capacityConfig: StorageCapacityConfig = DEFAULT_STORAGE_CAPACITY_CONFIG,
	entityContext?: {
		products?: { id: string }[];
		orders?: { id: string }[];
		sellers?: { id?: string; username: string }[];
	}
): StorageOverviewMetrics {
	const allFiles = files || [];
	const usedBytes = getStorageUsedBytes(allFiles);
	const capacityBytes = capacityConfig.capacityBytes;
	const availableBytes = getStorageAvailableBytes(allFiles, capacityBytes);
	const usagePercent = getStorageUsagePercent(allFiles, capacityBytes);

	// Monthly uploads (last 30 days)
	const now = Date.now();
	const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
	const monthlyFiles = allFiles.filter((f) => {
		const created = new Date(f.createdAt).getTime();
		return !isNaN(created) && created >= thirtyDaysAgo;
	});
	const monthlyUploadsCount = monthlyFiles.length;
	const monthlyUploadsBytes = monthlyFiles.reduce((sum, f) => sum + (Number(f.sizeBytes) || 0), 0);

	// Issues & diagnostic counts
	const failedUploadsCount = allFiles.filter((f) => f.status === 'failed').length;
	const quarantinedFilesCount = allFiles.filter((f) => f.status === 'quarantined').length;

	const orphanedFilesCount = allFiles.filter((f) => {
		if (f.status === 'deleted') return false;
		return isOrphanedFile(f, entityContext);
	}).length;

	const problematicFilesCount = failedUploadsCount + quarantinedFilesCount + orphanedFilesCount;

	// Determine alert level against capacity thresholds
	let alertLevel: 'normal' | 'warning' | 'high' | 'critical' = 'normal';
	if (usagePercent >= capacityConfig.criticalThresholdPercent) {
		alertLevel = 'critical';
	} else if (usagePercent >= capacityConfig.highThresholdPercent) {
		alertLevel = 'high';
	} else if (usagePercent >= capacityConfig.warningThresholdPercent) {
		alertLevel = 'warning';
	}

	return {
		usedBytes,
		capacityBytes,
		availableBytes,
		usagePercent,
		totalFilesCount: allFiles.filter((f) => f.status !== 'deleted').length,
		monthlyUploadsCount,
		monthlyUploadsBytes,
		problematicFilesCount,
		failedUploadsCount,
		quarantinedFilesCount,
		orphanedFilesCount,
		alertLevel
	};
}

/**
 * Diagnostic helper to detect orphaned files (files whose linked entity no longer resolves).
 */
export function isOrphanedFile(
	file: FileAsset,
	context?: {
		products?: { id: string }[];
		orders?: { id: string }[];
		sellers?: { id?: string; username: string }[];
		verifications?: { id?: string }[];
		blogPosts?: { id: string }[];
	}
): boolean {
	if (!file) return false;
	if (file.linkedEntityType === 'none' || !file.linkedEntityId) return true;
	if (!context) return false;

	switch (file.linkedEntityType) {
		case 'product':
			return context.products ? !context.products.some((p) => p.id === file.linkedEntityId) : false;
		case 'order':
			return context.orders ? !context.orders.some((o) => o.id === file.linkedEntityId) : false;
		case 'seller':
			return context.sellers
				? !context.sellers.some(
						(s) =>
							s.id === file.linkedEntityId ||
							s.username === file.linkedEntityId ||
							`seller_${s.username}` === file.linkedEntityId
					)
				: false;
		case 'blog_post':
			return context.blogPosts
				? !context.blogPosts.some((b) => b.id === file.linkedEntityId)
				: false;
		default:
			return false;
	}
}

/**
 * Security & Access helper (domain level).
 */
export function canAccessFile(
	user: { role: string; id?: string; sellerId?: string } | null,
	file: FileAsset,
	context?: { buyerEmail?: string }
): { allowed: boolean; reason?: string } {
	if (!file) {
		return { allowed: false, reason: 'File tidak ditemukan.' };
	}

	// Quarantined or deleted files are blocked
	if (file.status === 'deleted') {
		return { allowed: false, reason: 'File telah dihapus.' };
	}
	if (file.status === 'quarantined') {
		if (user && (user.role === 'admin' || user.role === 'super_admin')) {
			return { allowed: true, reason: 'Akses Admin ke file karantina.' };
		}
		return { allowed: false, reason: 'File sedang dikarantina untuk peninjauan keamanan.' };
	}

	// Public assets
	if (file.accessLevel === 'public') {
		return { allowed: true };
	}

	// Restricted documents (e.g. KTP)
	if (file.accessLevel === 'restricted') {
		if (user && (user.role === 'admin' || user.role === 'super_admin')) {
			return { allowed: true, reason: 'Akses Admin Terverifikasi.' };
		}
		if (
			user &&
			file.ownerSellerId &&
			(user.id === file.ownerSellerId || user.sellerId === file.ownerSellerId)
		) {
			return { allowed: true, reason: 'Akses Pemilik Dokumen.' };
		}
		return {
			allowed: false,
			reason: 'Dokumen berstatus restricted (hanya Admin & pemilik dokumen).'
		};
	}

	// Private assets (e.g. digital downloads, service work)
	if (file.accessLevel === 'private') {
		if (user && (user.role === 'admin' || user.role === 'super_admin')) {
			return { allowed: true, reason: 'Akses Admin Operasional.' };
		}
		if (
			user &&
			file.ownerSellerId &&
			(user.id === file.ownerSellerId || user.sellerId === file.ownerSellerId)
		) {
			return { allowed: true, reason: 'Akses Penjual Terkait.' };
		}
		return { allowed: false, reason: 'File berstatus private.' };
	}

	return { allowed: false, reason: 'Akses tidak diizinkan.' };
}

/**
 * Calculate historical storage accumulation for growth charts.
 */
export function getStorageGrowthTimeline(
	files: FileAsset[],
	period: '30d' | '90d' | '12m' = '30d'
): {
	label: string;
	date: string;
	cumulativeBytes: number;
	addedBytes: number;
	fileCount: number;
}[] {
	const activeFiles = (files || []).filter((f) => f.status !== 'deleted');
	const days = period === '30d' ? 30 : period === '90d' ? 90 : 365;
	const pointsCount = period === '12m' ? 12 : period === '90d' ? 12 : 15;

	const now = Date.now();
	const stepMs = (days * 24 * 60 * 60 * 1000) / pointsCount;

	const timeline: {
		label: string;
		date: string;
		cumulativeBytes: number;
		addedBytes: number;
		fileCount: number;
	}[] = [];

	for (let i = pointsCount; i >= 0; i--) {
		const timestamp = now - i * stepMs;
		const d = new Date(timestamp);
		const label =
			period === '12m'
				? d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
				: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

		// Sum all files created up to this point in time
		const filesUpToPoint = activeFiles.filter((f) => {
			const ct = new Date(f.createdAt).getTime();
			return !isNaN(ct) && ct <= timestamp;
		});

		const cumulativeBytes = filesUpToPoint.reduce((sum, f) => sum + (Number(f.sizeBytes) || 0), 0);

		timeline.push({
			label,
			date: d.toISOString().split('T')[0],
			cumulativeBytes,
			addedBytes: Math.round(cumulativeBytes * 0.1),
			fileCount: filesUpToPoint.length
		});
	}

	return timeline;
}
