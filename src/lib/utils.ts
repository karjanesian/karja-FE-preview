type ClassValue =
	| string
	| number
	| bigint
	| boolean
	| null
	| undefined
	| Record<string, boolean | null | undefined>
	| ClassValue[];

function toClassName(value: ClassValue): string {
	if (!value) return '';
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
		return String(value);
	}
	if (typeof value === 'boolean') return '';
	if (Array.isArray(value)) return value.map(toClassName).filter(Boolean).join(' ');
	return Object.keys(value)
		.filter((key) => value[key])
		.join(' ');
}

export function cn(...inputs: ClassValue[]) {
	return inputs.map(toClassName).filter(Boolean).join(' ');
}

export function formatRupiah(value: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
}

export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, N extends HTMLElement = HTMLElement> = T & { ref?: N | null };
