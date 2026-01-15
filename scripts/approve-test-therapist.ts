/**
 * Approve Test Therapist
 *
 * Approves a pending therapist to test the ecosystem sync flow.
 * This will trigger the auto-registration to ecosystem_sync_queue.
 *
 * Usage:
 *   tsx scripts/approve-test-therapist.ts <therapist_id>
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function approveTherapist(therapistId: string) {
	console.log('🔄 Approving Therapist for Ecosystem Testing');
	console.log('============================================\n');

	// Get therapist before approval
	const { data: beforeData, error: beforeError } = await supabase
		.from('therapists')
		.select('id, vetting_status, is_independent, ecosystem_org_id')
		.eq('id', therapistId)
		.single();

	if (beforeError) {
		console.error('❌ Failed to fetch therapist:', beforeError);
		process.exit(1);
	}

	if (!beforeData) {
		console.error('❌ Therapist not found');
		process.exit(1);
	}

	console.log('📋 Current Status:');
	console.log(`   ID: ${beforeData.id}`);
	console.log(`   Vetting Status: ${beforeData.vetting_status}`);
	console.log(`   Independent: ${beforeData.is_independent}`);
	console.log(`   Ecosystem Org ID: ${beforeData.ecosystem_org_id || '(none)'}\n`);

	if (beforeData.vetting_status === 'approved') {
		console.log('⚠️  Therapist is already approved\n');
	}

	// Approve therapist (this triggers auto-registration)
	console.log('✅ Approving therapist...');
	const { error: updateError } = await supabase
		.from('therapists')
		.update({ vetting_status: 'approved' })
		.eq('id', therapistId);

	if (updateError) {
		console.error('❌ Failed to approve therapist:', updateError);
		process.exit(1);
	}

	// Wait a moment for trigger to execute
	await new Promise(resolve => setTimeout(resolve, 1000));

	// Verify the ecosystem_org_id was generated
	const { data: afterData, error: afterError } = await supabase
		.from('therapists')
		.select('id, vetting_status, is_independent, ecosystem_org_id')
		.eq('id', therapistId)
		.single();

	if (afterError) {
		console.error('❌ Failed to verify approval:', afterError);
		process.exit(1);
	}

	console.log('\n📋 Updated Status:');
	console.log(`   Vetting Status: ${afterData.vetting_status}`);
	console.log(`   Ecosystem Org ID: ${afterData.ecosystem_org_id || '(ERROR: not generated!)'}\n`);

	// Check if queued
	const { data: queueData, error: queueError } = await supabase
		.from('ecosystem_sync_queue')
		.select('id, status, action, created_at')
		.eq('entity_type', 'therapist')
		.eq('entity_id', therapistId)
		.order('created_at', { ascending: false })
		.limit(1);

	if (queueError) {
		console.error('❌ Failed to check queue:', queueError);
		process.exit(1);
	}

	if (queueData && queueData.length > 0) {
		const queue = queueData[0];
		console.log('✅ Therapist queued for ecosystem sync!');
		console.log(`   Queue ID: ${queue.id}`);
		console.log(`   Status: ${queue.status}`);
		console.log(`   Action: ${queue.action}`);
		console.log(`   Queued At: ${queue.created_at}\n`);
		console.log('💡 Next steps:');
		console.log('   1. Run: npm run sync:ecosystem:dry-run');
		console.log('   2. Run: npm run sync:ecosystem');
		console.log('   3. Check Camino /admin/ecosystem dashboard');
	} else {
		console.log('⚠️  Therapist was NOT queued (check triggers)\n');
	}
}

const therapistId = process.argv[2];

if (!therapistId) {
	console.error('Usage: tsx scripts/approve-test-therapist.ts <therapist_id>');
	process.exit(1);
}

approveTherapist(therapistId).catch(err => {
	console.error('❌ Fatal error:', err);
	process.exit(1);
});
