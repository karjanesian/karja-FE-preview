import { SellerProfile, Product, JourneySignals } from '$lib/types';

/**
 * Checks if seller has completed minimum required store setup.
 * Rule:
 * - A valid handle/username is mandatory for a public store (non-empty trimmed string).
 * - A custom display name or explicit storeSetupCompleted marker is required.
 * - Default placeholder values (empty username, name === 'Teman Karja' without custom handle) remain incomplete.
 */
export function isStoreSetupComplete(
	sellerProfile?: SellerProfile,
	journeySignals?: JourneySignals
): boolean {
	if (!sellerProfile) return false;

	const username = sellerProfile.username?.trim().toLowerCase() || '';
	const name = sellerProfile.name?.trim() || '';

	// Store MUST have a non-empty handle/username to be publicly accessible
	if (!username) return false;

	const isDefaultName = !name || name === 'Teman Karja';
	const isExplicitlySaved = Boolean(journeySignals?.storeSetupCompleted);

	// Completed if custom name + custom username exist
	if (!isDefaultName && username !== '') return true;

	// Completed if explicit setup done flag exists and username is present
	if (isExplicitlySaved && username !== '') return true;

	return false;
}

/**
 * Checks if seller has created at least one real product according to onboarding rules.
 * Rule: Must have at least 1 active or draft product in products array.
 */
export function hasCreatedProduct(products?: Product[]): boolean {
	if (!products || !Array.isArray(products) || products.length === 0) return false;
	return products.some((p) => p && (p.status === 'active' || p.status === 'draft'));
}

/**
 * Checks if seller has shared a product.
 * Rule:
 * - Monotonic dependency: MUST have created a product first (Step 2 complete).
 * - Must have recorded a share signal (journeySignals.hasSharedProduct).
 */
export function hasSharedProduct(products?: Product[], journeySignals?: JourneySignals): boolean {
	if (!hasCreatedProduct(products)) return false;
	return Boolean(journeySignals?.hasSharedProduct);
}

/**
 * Derives canonical onboarding progress state ensuring monotonic progression.
 *
 * Monotonic Dependency Rule:
 * if !step1Complete: currentStep = 1
 * else if !step2Complete: currentStep = 2
 * else if !step3Complete: currentStep = 3
 * else: onboardingComplete = true
 */
export function getOnboardingProgress(
	sellerProfile?: SellerProfile,
	products?: Product[],
	journeySignals?: JourneySignals
) {
	const step1Complete = isStoreSetupComplete(sellerProfile, journeySignals);
	const step2Complete = step1Complete && hasCreatedProduct(products);
	const step3Complete = step2Complete && hasSharedProduct(products, journeySignals);

	let currentStep = 1;
	if (!step1Complete) {
		currentStep = 1;
	} else if (!step2Complete) {
		currentStep = 2;
	} else if (!step3Complete) {
		currentStep = 3;
	} else {
		currentStep = 3;
	}

	const onboardingComplete = step1Complete && step2Complete && step3Complete;

	return {
		step1Complete,
		step2Complete,
		step3Complete,
		currentStep,
		onboardingComplete
	};
}
