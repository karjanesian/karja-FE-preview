// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			sellerSession(): Promise<{
				status: 'authed' | 'anonymous' | 'offline';
				user: Record<string, unknown> | null;
			}>;
			adminSession(): Promise<{
				status: 'authed' | 'anonymous' | 'offline';
				user: Record<string, unknown> | null;
			}>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
