import type { MainNavTab } from '$lib/types';

const TAB_ROUTES: Record<MainNavTab, string> = {
	beranda: '/dashboard',
	pesanan: '/dashboard/orders',
	produk: '/dashboard/products',
	toko: '/dashboard/store',
	uangmu: '/dashboard/money',
	pengaturan: '/dashboard/settings'
};

export function tabRoute(tab: MainNavTab, targetId?: string): string {
	const base = TAB_ROUTES[tab] || '/dashboard';
	if (targetId && tab === 'pesanan') return `${base}/${targetId}`;
	if (targetId && tab === 'produk') return `${base}/${targetId}`;
	return base;
}
