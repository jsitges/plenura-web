import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import {
	getOrCreateClientWallet,
	getClientWallet,
	getWalletTransactions,
	initiateDeposit
} from '$lib/services/wallet.service';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	// Get user details
	const { data: userData } = await supabase
		.from('users')
		.select('email, full_name')
		.eq('id', user.id)
		.single();

	// Get or create wallet
	let wallet = await getClientWallet(supabase, user.id);

	if (!wallet && userData) {
		wallet = await getOrCreateClientWallet(
			supabase,
			user.id,
			userData.email,
			userData.full_name
		);
	}

	// Get recent transactions
	const transactions = wallet
		? await getWalletTransactions(supabase, wallet.id, 20)
		: [];

	return {
		wallet,
		transactions
	};
};

export const actions: Actions = {
	deposit: async ({ request, locals }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const amountStr = formData.get('amount') as string;
		const amount = parseFloat(amountStr);

		if (isNaN(amount) || amount < 50) {
			return fail(400, { error: 'El monto mínimo es $50 MXN' });
		}

		if (amount > 10000) {
			return fail(400, { error: 'El monto máximo es $10,000 MXN' });
		}

		const amountCents = Math.round(amount * 100);

		// Get wallet
		const wallet = await getClientWallet(supabase, user.id);
		if (!wallet) {
			return fail(400, { error: 'No se encontró tu cartera' });
		}

		// Initiate deposit
		const result = await initiateDeposit(supabase, user.id, wallet.id, amountCents);

		if (!result.success) {
			return fail(500, { error: result.error ?? 'Error al procesar el depósito' });
		}

		return { success: true, message: 'Depósito procesado exitosamente' };
	}
};
