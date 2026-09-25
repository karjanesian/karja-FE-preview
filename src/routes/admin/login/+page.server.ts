import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = await locals.adminSession();

	if (session.status === 'authed' && url.searchParams.get('reason') !== 'expired') {
		redirect(307, '/admin');
	}

	return {};
};
