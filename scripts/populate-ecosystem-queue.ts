/**
 * Populate Ecosystem Sync Queue
 *
 * One-time script to populate the ecosystem_sync_queue with all existing
 * practices and independent therapists that need to be synced to Colectiva.
 *
 * Run this after migration 018 to register existing organizations.
 * New organizations will be queued automatically by database triggers.
 *
 * Usage:
 *   npm run populate:ecosystem
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function populateQueue() {
	console.log('🔄 Populating Ecosystem Sync Queue');
	console.log('====================================\n');

	if (!SUPABASE_SERVICE_ROLE_KEY) {
		console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
		process.exit(1);
	}

	let practiceCount = 0;
	let therapistCount = 0;
	let errorCount = 0;

	// 1. Get all practices with ecosystem_org_id
	console.log('📋 Fetching practices...');
	const { data: practices, error: practicesError } = await supabase
		.from('practices')
		.select('id, ecosystem_org_id')
		.not('ecosystem_org_id', 'is', null);

	if (practicesError) {
		console.error('❌ Failed to fetch practices:', practicesError);
		process.exit(1);
	}

	console.log(`   Found ${practices?.length || 0} practices\n`);

	// 2. Get all independent therapists with ecosystem_org_id
	console.log('📋 Fetching independent therapists...');
	const { data: therapists, error: therapistsError } = await supabase
		.from('therapists')
		.select('id, ecosystem_org_id')
		.eq('is_independent', true)
		.eq('vetting_status', 'approved')
		.not('ecosystem_org_id', 'is', null);

	if (therapistsError) {
		console.error('❌ Failed to fetch therapists:', therapistsError);
		process.exit(1);
	}

	console.log(`   Found ${therapists?.length || 0} independent therapists\n`);

	// 3. Queue practices
	if (practices && practices.length > 0) {
		console.log('🔄 Queuing practices...');
		for (const practice of practices) {
			try {
				// Check if already queued
				const { data: existing } = await supabase
					.from('ecosystem_sync_queue')
					.select('id')
					.eq('entity_type', 'practice')
					.eq('entity_id', practice.id)
					.single();

				if (existing) {
					console.log(`   ⏭️  Practice ${practice.id} already queued`);
					continue;
				}

				// Call the queue function
				const { error } = await supabase.rpc('queue_ecosystem_sync', {
					p_entity_type: 'practice',
					p_entity_id: practice.id,
					p_action: 'register'
				});

				if (error) {
					console.error(`   ❌ Failed to queue practice ${practice.id}:`, error.message);
					errorCount++;
				} else {
					console.log(`   ✅ Queued practice ${practice.id}`);
					practiceCount++;
				}
			} catch (err: any) {
				console.error(`   ❌ Error queuing practice ${practice.id}:`, err.message);
				errorCount++;
			}
		}
		console.log();
	}

	// 4. Queue therapists
	if (therapists && therapists.length > 0) {
		console.log('🔄 Queuing independent therapists...');
		for (const therapist of therapists) {
			try {
				// Check if already queued
				const { data: existing } = await supabase
					.from('ecosystem_sync_queue')
					.select('id')
					.eq('entity_type', 'therapist')
					.eq('entity_id', therapist.id)
					.single();

				if (existing) {
					console.log(`   ⏭️  Therapist ${therapist.id} already queued`);
					continue;
				}

				// Call the queue function
				const { error } = await supabase.rpc('queue_ecosystem_sync', {
					p_entity_type: 'therapist',
					p_entity_id: therapist.id,
					p_action: 'register'
				});

				if (error) {
					console.error(`   ❌ Failed to queue therapist ${therapist.id}:`, error.message);
					errorCount++;
				} else {
					console.log(`   ✅ Queued therapist ${therapist.id}`);
					therapistCount++;
				}
			} catch (err: any) {
				console.error(`   ❌ Error queuing therapist ${therapist.id}:`, err.message);
				errorCount++;
			}
		}
		console.log();
	}

	// 5. Summary
	console.log('====================================');
	console.log('📊 Summary');
	console.log(`  ✅ Practices queued: ${practiceCount}`);
	console.log(`  ✅ Therapists queued: ${therapistCount}`);
	console.log(`  📋 Total: ${practiceCount + therapistCount}`);
	if (errorCount > 0) {
		console.log(`  ❌ Errors: ${errorCount}`);
	}
	console.log();
	console.log('💡 Next step: Run "npm run sync:ecosystem:dry-run" to preview sync');
	console.log('              Then run "npm run sync:ecosystem" to actually sync');
}

populateQueue().catch(err => {
	console.error('❌ Fatal error:', err);
	process.exit(1);
});
