import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.sellerSession();

	// BE tidak terjangkau → jangan blokir; fallback simulasi lokal client yang menangani.
	if (session.status === 'offline') {
		return { sessionStatus: 'offline' as const, user: null };
	}

	if (session.status !== 'authed' || !session.user) {
		redirect(307, '/login');
	}

	return {
		sessionStatus: 'authed' as const,
		user: session.user as { id: string; email: string; name: string; username: string }
	};
};
