import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

interface EmailPreferences {
	booking_reminders: boolean;
	review_requests: boolean;
	tips_received: boolean;
	marketing: boolean;
	weekly_reports: boolean;
}

const DEFAULT_PREFERENCES: EmailPreferences = {
	booking_reminders: true,
	review_requests: true,
	tips_received: true,
	marketing: false,
	weekly_reports: true
};

export const load: PageServerLoad = async ({ locals }) => {
	const { user, userProfile } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	const emailPreferences = (userProfile?.email_preferences as EmailPreferences) ?? DEFAULT_PREFERENCES;

	return {
		emailPreferences
	};
};

export const actions: Actions = {
	updatePreferences: async ({ request, locals }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();

		const emailPreferences: EmailPreferences = {
			booking_reminders: formData.get('booking_reminders') === 'on',
			review_requests: formData.get('review_requests') === 'on',
			tips_received: formData.get('tips_received') === 'on',
			marketing: formData.get('marketing') === 'on',
			weekly_reports: formData.get('weekly_reports') === 'on'
		};

		const { error } = await supabase
			.from('users')
			.update({ email_preferences: emailPreferences })
			.eq('id', user.id);

		if (error) {
			return fail(500, { error: 'Error al guardar preferencias' });
		}

		return { success: true };
	}
};
