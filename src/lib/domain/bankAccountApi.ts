import { api } from '$lib/api';

/** Rekening bank default seller dari BE. */
export interface ApiBankAccount {
	bank: string;
	accountNumber: string;
	accountHolder: string;
}

/** Body PUT /seller/bank-account. */
export interface UpdateBankAccountDto {
	bank: string;
	accountNumber: string;
	accountHolder: string;
}

/* ------------------------------- endpoints ------------------------------- */

/** Rekening default seller, atau null kalau belum diatur. */
export async function getBankAccount(): Promise<ApiBankAccount | null> {
	return api<ApiBankAccount | null>('/seller/bank-account');
}

/** Simpan/ubah rekening default seller; mengembalikan rekening tersimpan. */
export async function updateBankAccount(dto: UpdateBankAccountDto): Promise<ApiBankAccount> {
	return api<ApiBankAccount>('/seller/bank-account', { method: 'PUT', body: dto });
}
