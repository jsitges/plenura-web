/**
 * Audit Logging Service
 *
 * Records security-relevant events for compliance and debugging.
 * All admin access, ecosystem operations, and sensitive actions are logged.
 */

import { createServiceRoleClient } from '$lib/supabase/server';

export interface AuditLogEntry {
	event_type: string;
	event_id?: string;
	actor_type: 'admin' | 'app' | 'system' | 'user';
	actor_id?: string;
	actor_email?: string;
	actor_ip?: string;
	target_type?: string;
	target_id?: string;
	target_app?: string;
	action: string;
	outcome: 'success' | 'failure' | 'denied';
	ecosystem_org_id?: string;
	session_id?: string;
	metadata?: Record<string, unknown>;
	error_message?: string;
}

/**
 * Log an audit event
 *
 * Non-blocking: errors are logged but don't throw
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
	try {
		const supabase = createServiceRoleClient();

		const { error } = await supabase.from('ecosystem_audit_log').insert({
			event_type: entry.event_type,
			event_id: entry.event_id,
			actor_type: entry.actor_type,
			actor_id: entry.actor_id,
			actor_email: entry.actor_email,
			actor_ip: entry.actor_ip,
			target_type: entry.target_type,
			target_id: entry.target_id,
			target_app: entry.target_app || 'plenura',
			action: entry.action,
			outcome: entry.outcome,
			ecosystem_org_id: entry.ecosystem_org_id,
			session_id: entry.session_id,
			metadata: entry.metadata || {},
			error_message: entry.error_message
		});

		if (error) {
			console.error('[AuditLog] Failed to log event:', error);
		}
	} catch (error) {
		// Non-blocking: log error but don't throw
		console.error('[AuditLog] Error logging event:', error);
	}
}

/**
 * Log admin lookup event
 */
export async function logAdminLookup(params: {
	adminId: string;
	adminEmail?: string;
	adminIp?: string;
	rbsOrgId: string;
	targetType?: string;
	targetId?: string;
	outcome: 'success' | 'failure' | 'denied';
	reason?: string;
	errorMessage?: string;
}): Promise<void> {
	await logAuditEvent({
		event_type: 'admin.lookup',
		actor_type: 'admin',
		actor_id: params.adminId,
		actor_email: params.adminEmail,
		actor_ip: params.adminIp,
		target_type: params.targetType,
		target_id: params.targetId,
		action: 'lookup',
		outcome: params.outcome,
		ecosystem_org_id: params.rbsOrgId,
		metadata: { reason: params.reason },
		error_message: params.errorMessage
	});
}

/**
 * Log admin impersonation start
 */
export async function logImpersonationStart(params: {
	sessionId: string;
	adminId: string;
	adminEmail?: string;
	adminIp?: string;
	targetType: string;
	targetId: string;
	rbsOrgId: string;
	reason: string;
	readOnly: boolean;
	expiresAt: Date;
}): Promise<void> {
	await logAuditEvent({
		event_type: 'admin.impersonation.started',
		actor_type: 'admin',
		actor_id: params.adminId,
		actor_email: params.adminEmail,
		actor_ip: params.adminIp,
		target_type: params.targetType,
		target_id: params.targetId,
		action: 'impersonate_start',
		outcome: 'success',
		ecosystem_org_id: params.rbsOrgId,
		session_id: params.sessionId,
		metadata: {
			reason: params.reason,
			read_only: params.readOnly,
			expires_at: params.expiresAt.toISOString()
		}
	});
}

/**
 * Log webhook received
 */
export async function logWebhookReceived(params: {
	eventId: string;
	sourceApp: string;
	eventType: string;
	outcome: 'success' | 'failure';
	errorMessage?: string;
}): Promise<void> {
	await logAuditEvent({
		event_type: 'webhook.received',
		event_id: params.eventId,
		actor_type: 'app',
		actor_id: params.sourceApp,
		target_app: params.sourceApp,
		action: params.eventType,
		outcome: params.outcome,
		error_message: params.errorMessage
	});
}

/**
 * Log authentication failure
 */
export async function logAuthFailure(params: {
	reason: string;
	ip?: string;
	appId?: string;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	await logAuditEvent({
		event_type: 'auth.failed',
		actor_type: params.appId ? 'app' : 'system',
		actor_id: params.appId,
		actor_ip: params.ip,
		action: 'authenticate',
		outcome: 'denied',
		error_message: params.reason,
		metadata: params.metadata
	});
}
