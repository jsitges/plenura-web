/**
 * Ecosystem Sync Queue Processor
 *
 * Processes the ecosystem_sync_queue table and registers Plenura organizations
 * to Colectiva following the established ecosystem pattern.
 *
 * All apps (Caracol, La Hoja, Cosmos Pet, Plenura) register TO Colectiva.
 * Camino then fetches FROM Colectiva as the single source of truth.
 *
 * Usage:
 *   npx tsx scripts/sync-ecosystem-queue.ts
 *
 * Options:
 *   --dry-run    Preview what would be synced without actually syncing
 *   --limit N    Process only N items (default: 10)
 *   --all        Process all pending items
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const COLECTIVA_URL = process.env.COLECTIVA_API_URL || 'https://colectiva.redbroomsoftware.com';
const COLECTIVA_API_KEY = process.env.COLECTIVA_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface QueueItem {
	id: string;
	entity_type: string;
	entity_id: string;
	ecosystem_org_id: string;
	action: string;
	payload: any;
	status: string;
	attempts: number;
	created_at: string;
}

interface ColectivaPayload {
	name: string;
	rfc?: string | null;
	type?: string;
	app_org_id: string;
	owner_email?: string;
	billing?: {
		plan: string;
		status: string;
	};
}

/**
 * Transform Plenura payload to Colectiva's expected format
 */
function transformPayload(queueItem: QueueItem): ColectivaPayload {
	const payload = queueItem.payload;

	return {
		name: payload.organization_name,
		rfc: payload.tax_id || null,
		type: payload.business_type || 'business',
		app_org_id: payload.ecosystem_org_id,
		owner_email: payload.email,
		billing: {
			plan: payload.subscription_tier || 'free',
			status: payload.is_active ? 'active' : 'inactive'
		}
	};
}

/**
 * Register organization to Colectiva
 */
async function registerToColectiva(
	colectivaPayload: ColectivaPayload
): Promise<{ success: boolean; error?: string; ecosystem_org_id?: string }> {
	try {
		const response = await fetch(`${COLECTIVA_URL}/api/ecosystem-orgs`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${COLECTIVA_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(colectivaPayload)
		});

		if (!response.ok) {
			const errorText = await response.text();
			return {
				success: false,
				error: `HTTP ${response.status}: ${errorText}`
			};
		}

		const data = await response.json();
		return {
			success: true,
			ecosystem_org_id: data.ecosystem_org_id
		};
	} catch (err: any) {
		return {
			success: false,
			error: err.message || 'Unknown error'
		};
	}
}

/**
 * Update queue item status
 */
async function updateQueueStatus(
	queueId: string,
	status: 'processing' | 'success' | 'failed',
	errorMessage?: string
) {
	const updateData: any = {
		status,
		last_attempt_at: new Date().toISOString()
	};

	if (status === 'success') {
		updateData.processed_at = new Date().toISOString();
	} else if (status === 'failed' && errorMessage) {
		updateData.error_message = errorMessage;
	}

	const { error } = await supabase
		.from('ecosystem_sync_queue')
		.update(updateData)
		.eq('id', queueId);

	if (error) {
		console.error(`Failed to update queue item ${queueId}:`, error);
	}
}

/**
 * Increment attempts counter
 */
async function incrementAttempts(queueId: string) {
	const { error } = await supabase.rpc('increment_sync_attempts', {
		queue_id: queueId
	});

	if (error) {
		// Fallback if function doesn't exist
		const { data } = await supabase
			.from('ecosystem_sync_queue')
			.select('attempts')
			.eq('id', queueId)
			.single();

		if (data) {
			await supabase
				.from('ecosystem_sync_queue')
				.update({ attempts: (data.attempts || 0) + 1 })
				.eq('id', queueId);
		}
	}
}

/**
 * Process a single queue item
 */
async function processQueueItem(item: QueueItem, dryRun: boolean): Promise<boolean> {
	console.log(`\n[${ item.entity_type}] ${item.ecosystem_org_id}`);
	console.log(`  Action: ${item.action}`);
	console.log(`  Attempts: ${item.attempts}`);

	if (item.action !== 'register') {
		console.log(`  ⚠️  Skipping: Only 'register' action is currently supported`);
		return false;
	}

	// Transform payload
	const colectivaPayload = transformPayload(item);
	console.log(`  Organization: ${colectivaPayload.name}`);
	console.log(`  Email: ${colectivaPayload.owner_email}`);

	if (dryRun) {
		console.log(`  🔍 DRY RUN: Would send to Colectiva:`, JSON.stringify(colectivaPayload, null, 2));
		return true;
	}

	// Mark as processing
	await updateQueueStatus(item.id, 'processing');
	await incrementAttempts(item.id);

	// Register to Colectiva
	console.log(`  📤 Registering to Colectiva...`);
	const result = await registerToColectiva(colectivaPayload);

	if (result.success) {
		console.log(`  ✅ Success! Ecosystem ID: ${result.ecosystem_org_id}`);
		await updateQueueStatus(item.id, 'success');
		return true;
	} else {
		console.log(`  ❌ Failed: ${result.error}`);

		// Mark as failed if too many attempts
		if (item.attempts >= 3) {
			console.log(`  ⛔ Max attempts reached, marking as failed`);
			await updateQueueStatus(item.id, 'failed', result.error);
		} else {
			console.log(`  🔄 Will retry later`);
			await updateQueueStatus(item.id, 'pending', result.error);
		}
		return false;
	}
}

/**
 * Main sync function
 */
async function syncQueue(options: { dryRun: boolean; limit: number }) {
	console.log('🔄 Plenura Ecosystem Sync Queue Processor');
	console.log('========================================\n');

	if (options.dryRun) {
		console.log('🔍 DRY RUN MODE - No actual changes will be made\n');
	}

	// Validate configuration
	if (!COLECTIVA_API_KEY && !options.dryRun) {
		console.error('❌ COLECTIVA_API_KEY environment variable is required');
		process.exit(1);
	}

	if (!SUPABASE_SERVICE_KEY) {
		console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
		process.exit(1);
	}

	// Fetch pending items
	const { data: queueItems, error } = await supabase
		.from('ecosystem_sync_queue')
		.select('*')
		.eq('status', 'pending')
		.order('created_at', { ascending: true })
		.limit(options.limit);

	if (error) {
		console.error('❌ Failed to fetch queue items:', error);
		process.exit(1);
	}

	if (!queueItems || queueItems.length === 0) {
		console.log('✨ No pending items in queue');
		return;
	}

	console.log(`📋 Found ${queueItems.length} pending items\n`);

	// Process each item
	let successCount = 0;
	let failureCount = 0;

	for (const item of queueItems) {
		const success = await processQueueItem(item, options.dryRun);
		if (success) {
			successCount++;
		} else {
			failureCount++;
		}
	}

	console.log('\n========================================');
	console.log('📊 Summary');
	console.log(`  ✅ Success: ${successCount}`);
	console.log(`  ❌ Failed: ${failureCount}`);
	console.log(`  📋 Total: ${queueItems.length}`);

	if (options.dryRun) {
		console.log('\n💡 Run without --dry-run to actually sync to Colectiva');
	}
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const all = args.includes('--all');
const limitIndex = args.indexOf('--limit');
const limit = all ? 1000 : (limitIndex >= 0 ? parseInt(args[limitIndex + 1]) || 10 : 10);

// Run sync
syncQueue({ dryRun, limit }).catch(err => {
	console.error('❌ Fatal error:', err);
	process.exit(1);
});
