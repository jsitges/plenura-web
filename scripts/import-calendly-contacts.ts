#!/usr/bin/env npx tsx
/**
 * Import Calendly contacts for a therapist
 *
 * This script:
 * 1. Fetches all scheduled events from Calendly
 * 2. Extracts unique invitees (contacts)
 * 3. Creates user accounts in Supabase
 * 4. Sends invitation emails via magic link
 *
 * Usage:
 *   npx tsx scripts/import-calendly-contacts.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const CALENDLY_TOKEN = process.env.CALENDLY_TOKEN!;
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'https://vvbiriktnevlcjrejzoy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const THERAPIST_EMAIL = 'ivannasitges@gmail.com';

// Calendly API base URL
const CALENDLY_API = 'https://api.calendly.com';

interface CalendlyUser {
	uri: string;
	name: string;
	email: string;
}

interface CalendlyEvent {
	uri: string;
	name: string;
	start_time: string;
	status: string;
}

interface CalendlyInvitee {
	email: string;
	name: string;
	text_reminder_number?: string;
	status: string;
}

interface Contact {
	email: string;
	name: string;
	phone?: string;
}

// Initialize Supabase admin client (lazy)
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
	if (!supabase) {
		if (!SUPABASE_SERVICE_KEY) {
			throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
		}
		supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		});
	}
	return supabase;
}

async function fetchCalendlyUser(): Promise<CalendlyUser> {
	const response = await fetch(`${CALENDLY_API}/users/me`, {
		headers: { Authorization: `Bearer ${CALENDLY_TOKEN}` }
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch Calendly user: ${response.statusText}`);
	}

	const data = await response.json();
	return data.resource;
}

async function fetchAllEvents(userUri: string): Promise<CalendlyEvent[]> {
	const allEvents: CalendlyEvent[] = [];
	let nextPageToken: string | null = null;

	console.log('Fetching events from Calendly...');

	do {
		const url = new URL(`${CALENDLY_API}/scheduled_events`);
		url.searchParams.set('user', userUri);
		url.searchParams.set('count', '100');
		if (nextPageToken) {
			url.searchParams.set('page_token', nextPageToken);
		}

		const response = await fetch(url.toString(), {
			headers: { Authorization: `Bearer ${CALENDLY_TOKEN}` }
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch events: ${response.statusText}`);
		}

		const data = await response.json();
		allEvents.push(...data.collection);
		nextPageToken = data.pagination.next_page_token;

		console.log(`  Fetched ${allEvents.length} events so far...`);
	} while (nextPageToken);

	return allEvents;
}

async function fetchInvitees(eventUri: string): Promise<CalendlyInvitee[]> {
	const eventId = eventUri.split('/').pop();
	const response = await fetch(`${CALENDLY_API}/scheduled_events/${eventId}/invitees`, {
		headers: { Authorization: `Bearer ${CALENDLY_TOKEN}` }
	});

	if (!response.ok) {
		console.warn(`  Warning: Failed to fetch invitees for event ${eventId}`);
		return [];
	}

	const data = await response.json();
	return data.collection;
}

async function extractUniqueContacts(events: CalendlyEvent[]): Promise<Contact[]> {
	const contactsMap = new Map<string, Contact>();

	console.log(`\nExtracting contacts from ${events.length} events...`);

	for (let i = 0; i < events.length; i++) {
		const event = events[i];
		const invitees = await fetchInvitees(event.uri);

		for (const invitee of invitees) {
			const email = invitee.email.toLowerCase().trim();

			// Skip the therapist's own email
			if (email === THERAPIST_EMAIL.toLowerCase()) continue;

			if (!contactsMap.has(email)) {
				contactsMap.set(email, {
					email,
					name: invitee.name || '',
					phone: invitee.text_reminder_number?.replace(/\s+/g, '') || undefined
				});
			}
		}

		// Progress indicator
		if ((i + 1) % 10 === 0) {
			console.log(`  Processed ${i + 1}/${events.length} events...`);
		}
	}

	return Array.from(contactsMap.values());
}

async function findTherapist(): Promise<{ id: string; userId: string } | null> {
	const db = getSupabase();

	// First find the user
	const { data: user, error: userError } = await db
		.from('users')
		.select('id')
		.eq('email', THERAPIST_EMAIL)
		.single();

	if (userError || !user) {
		console.error('Therapist user not found:', userError?.message);
		return null;
	}

	// Then find the therapist profile
	const { data: therapist, error: therapistError } = await db
		.from('therapists')
		.select('id')
		.eq('user_id', user.id)
		.single();

	if (therapistError || !therapist) {
		console.error('Therapist profile not found:', therapistError?.message);
		return null;
	}

	return { id: therapist.id, userId: user.id };
}

async function createUserAndInvite(
	contact: Contact,
	therapistId: string
): Promise<{ success: boolean; error?: string }> {
	const db = getSupabase();

	try {
		// Check if user already exists
		const { data: existingUser } = await db
			.from('users')
			.select('id')
			.eq('email', contact.email.toLowerCase())
			.single();

		if (existingUser) {
			console.log(`  User ${contact.email} already exists, skipping...`);
			return { success: true };
		}

		// Create user and send invitation email
		const { data: authUser, error: authError } = await db.auth.admin.inviteUserByEmail(
			contact.email,
			{
				data: {
					full_name: contact.name,
					phone: contact.phone,
					invited_by_therapist: therapistId
				},
				redirectTo: `${process.env.PUBLIC_APP_URL || 'https://plenura.redbroomsoftware.com'}/auth/callback`
			}
		);

		if (authError) {
			// If user already exists in auth but not in users table
			if (authError.message.includes('already been registered')) {
				console.log(`  User ${contact.email} already registered in auth, skipping...`);
				return { success: true };
			}
			return { success: false, error: authError.message };
		}

		// Update user profile with phone if provided
		if (contact.phone && authUser?.user?.id) {
			await db.from('users').update({ phone: contact.phone }).eq('id', authUser.user.id);
		}

		console.log(`  ✓ Invited ${contact.name} <${contact.email}>`);
		return { success: true };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

async function main() {
	console.log('='.repeat(60));
	console.log('Calendly Contact Import for Plenura');
	console.log('='.repeat(60));

	// Check for dry-run mode
	const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');
	if (dryRun) {
		console.log('\n⚠️  DRY RUN MODE - No invitations will be sent\n');
	}

	// Validate environment
	if (!CALENDLY_TOKEN) {
		console.error('Error: CALENDLY_TOKEN environment variable is required');
		process.exit(1);
	}

	if (!SUPABASE_SERVICE_KEY && !dryRun) {
		console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
		process.exit(1);
	}

	// Step 1: Get Calendly user
	console.log('\n1. Fetching Calendly user info...');
	const calendlyUser = await fetchCalendlyUser();
	console.log(`   User: ${calendlyUser.name} <${calendlyUser.email}>`);

	// Step 2: Find therapist in Plenura (skip in dry run)
	let therapist: { id: string; userId: string } | null = null;
	if (!dryRun) {
		console.log('\n2. Finding therapist in Plenura...');
		therapist = await findTherapist();
		if (!therapist) {
			console.error('Error: Could not find therapist in database');
			process.exit(1);
		}
		console.log(`   Found therapist ID: ${therapist.id}`);
	} else {
		console.log('\n2. Skipping therapist lookup (dry run)...');
	}

	// Step 3: Fetch all events
	console.log('\n3. Fetching all scheduled events...');
	const events = await fetchAllEvents(calendlyUser.uri);
	console.log(`   Total events: ${events.length}`);

	// Step 4: Extract unique contacts
	console.log('\n4. Extracting unique contacts...');
	const contacts = await extractUniqueContacts(events);
	console.log(`   Unique contacts found: ${contacts.length}`);

	// Preview contacts
	console.log('\n5. Contacts found:');
	console.log('-'.repeat(60));
	contacts.forEach((c, i) => {
		console.log(`   ${i + 1}. ${c.name} <${c.email}>${c.phone ? ` (${c.phone})` : ''}`);
	});
	console.log('-'.repeat(60));

	// Export to JSON for later use
	const outputFile = 'calendly-contacts.json';
	const fs = await import('fs');
	fs.writeFileSync(outputFile, JSON.stringify(contacts, null, 2));
	console.log(`\n   Contacts exported to: ${outputFile}`);

	if (dryRun) {
		console.log('\n' + '='.repeat(60));
		console.log('DRY RUN COMPLETE');
		console.log('='.repeat(60));
		console.log(`   Total contacts extracted: ${contacts.length}`);
		console.log(`   Run without --dry-run to send invitations`);
		console.log('='.repeat(60));
		return;
	}

	// Confirmation prompt
	console.log('\n6. Creating accounts and sending invitations...');

	let successCount = 0;
	let errorCount = 0;

	for (const contact of contacts) {
		const result = await createUserAndInvite(contact, therapist!.id);
		if (result.success) {
			successCount++;
		} else {
			errorCount++;
			console.error(`  ✗ Failed to invite ${contact.email}: ${result.error}`);
		}

		// Small delay to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 200));
	}

	// Summary
	console.log('\n' + '='.repeat(60));
	console.log('IMPORT COMPLETE');
	console.log('='.repeat(60));
	console.log(`   Total contacts: ${contacts.length}`);
	console.log(`   Successfully invited: ${successCount}`);
	console.log(`   Errors: ${errorCount}`);
	console.log('='.repeat(60));
}

main().catch(console.error);
