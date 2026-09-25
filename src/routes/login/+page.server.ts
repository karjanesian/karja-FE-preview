import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = await locals.sellerSession();

	// Sudah punya sesi valid → langsung ke dashboard (kecuali sedang menampilkan alasan expired).
	if (session.status === 'authed' && url.searchParams.get('reason') !== 'expired') {
		redirect(307, '/dashboard');
	}

	return {};
};
