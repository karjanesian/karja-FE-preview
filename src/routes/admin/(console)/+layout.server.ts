import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.adminSession();

	if (session.status === 'offline') {
		return { sessionStatus: 'offline' as const, user: null };
	}

	if (session.status !== 'authed' || !session.user) {
		redirect(307, '/admin/login');
	}

	return {
		sessionStatus: 'authed' as const,
		user: session.user as {
			id: string;
			name: string;
			email: string;
			role: string;
			status: string;
		}
	};
};
