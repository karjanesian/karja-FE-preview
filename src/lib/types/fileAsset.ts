/**
 * KARJA FILE ASSET & STORAGE DOMAIN TYPES (v1.5.4)
 * Canonical metadata model for all files, media, and documents across Karja.
 */

export type FileAssetCategory =
	| 'product_file'
	| 'product_image'
	| 'service_buyer_input'
	| 'service_delivery'
	| 'verification_document'
	| 'blog_asset'
	| 'store_asset'
	| 'other';

export type FileAccessLevel = 'public' | 'private' | 'restricted';

export type FileAssetStatus = 'uploading' | 'available' | 'failed' | 'deleted' | 'quarantined';

export type StorageProvider = 'mock' | 'filegarden' | 's3' | 'r2' | 'supabase' | 'other';

export type LinkedEntityType =
	'product' | 'order' | 'verification' | 'blog_post' | 'seller' | 'none';

export interface FileAsset {
	id: string;
	ownerType: 'seller' | 'buyer' | 'platform' | 'system';
	ownerSellerId?: string;
	uploadedByUserId?: string;

	category: FileAssetCategory;
	accessLevel: FileAccessLevel;

	originalName: string;
	mimeType: string;
	extension?: string;

	// Single source of truth for file size in bytes
	sizeBytes: number;

	storageProvider: StorageProvider;
	bucket?: string;
	objectKey: string;
	publicUrl?: string; // Only present/used for public access level or preview

	linkedEntityType: LinkedEntityType;
	linkedEntityId: string;

	status: FileAssetStatus;

	checksum?: string;
	metadata?: {
		failureReason?: string;
		quarantineReason?: string;
		quarantinedBy?: string;
		quarantinedAt?: string;
		dimensions?: { width: number; height: number };
		durationSeconds?: number;
		downloadCount?: number;
		version?: number;
		[key: string]: any;
	};

	createdAt: string;
	uploadedAt?: string;
	deletedAt?: string;
}

export interface StorageCapacityConfig {
	capacityBytes: number; // e.g. 100 GB = 100 * 1024 * 1024 * 1024
	warningThresholdPercent: number; // 70
	highThresholdPercent: number; // 85
	criticalThresholdPercent: number; // 95
	isPrototypeMock: boolean;
}

export const DEFAULT_STORAGE_CAPACITY_CONFIG: StorageCapacityConfig = {
	capacityBytes: 100 * 1024 * 1024 * 1024, // 100 GB prototype capacity
	warningThresholdPercent: 70,
	highThresholdPercent: 85,
	criticalThresholdPercent: 95,
	isPrototypeMock: true
};

export interface StorageCategoryBreakdown {
	category: FileAssetCategory;
	label: string;
	totalBytes: number;
	fileCount: number;
	percentage: number;
}

export interface SellerStorageSummary {
	sellerId: string;
	totalBytes: number;
	fileCount: number;
	digitalBytes: number;
	serviceBytes: number;
	imageBytes: number;
	otherBytes: number;
}

export interface StorageOverviewMetrics {
	usedBytes: number;
	capacityBytes: number;
	availableBytes: number;
	usagePercent: number;
	totalFilesCount: number;
	monthlyUploadsCount: number;
	monthlyUploadsBytes: number;
	problematicFilesCount: number;
	failedUploadsCount: number;
	quarantinedFilesCount: number;
	orphanedFilesCount: number;
	alertLevel: 'normal' | 'warning' | 'high' | 'critical';
}
