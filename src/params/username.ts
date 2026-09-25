import { isReservedSlug } from '$lib/domain/reservedSlugs';

export function match(param: string): boolean {
	return /^[a-z0-9_.-]{3,30}$/.test(param) && !isReservedSlug(param) && !param.startsWith('@');
}
