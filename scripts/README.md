# Plenura Scripts

## Ecosystem Sync Queue Processor

### Overview

This script processes the `ecosystem_sync_queue` table and registers Plenura organizations (practices and independent therapists) to Colectiva, following the established ecosystem pattern used by all RBS apps.

**Ecosystem Architecture Pattern:**
```
Plenura    ──┐
Caracol    ──┤
La Hoja    ──┼──> POST to Colectiva ──> Camino fetches from Colectiva
Cosmos Pet ──┘     /api/ecosystem-orgs      /api/admin/ecosystem
```

All apps register TO Colectiva. Colectiva is the single source of truth. Camino queries FROM Colectiva to display the ecosystem dashboard.

### Prerequisites

1. **Environment Variables** (add to `.env` or set in shell):
   ```bash
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   COLECTIVA_URL=https://colectiva.redbroomsoftware.com
   COLECTIVA_API_KEY=your-colectiva-api-key
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Usage

#### Preview what would be synced (dry run)
```bash
npm run sync:ecosystem:dry-run
```

#### Sync up to 10 pending items
```bash
npm run sync:ecosystem
```

#### Sync all pending items
```bash
npm run sync:ecosystem:all
```

#### Sync with custom limit
```bash
npx tsx scripts/sync-ecosystem-queue.ts --limit 50
```

### How It Works

1. **Queue Population**: Whenever a practice is created or an independent therapist is approved in Plenura, a trigger automatically adds an entry to `ecosystem_sync_queue` with action='register'.

2. **Sync Processing**: This script:
   - Fetches pending items from the queue
   - Transforms each item to Colectiva's expected format
   - POSTs to `https://colectiva.redbroomsoftware.com/api/ecosystem-orgs`
   - Updates queue status (success/failed)
   - Retries failed items (max 3 attempts)

3. **Data Flow**:
   ```
   Plenura DB → ecosystem_sync_queue → Sync Script → Colectiva → Camino Dashboard
   ```

### Monitoring

Check pending syncs in Supabase:
```sql
SELECT
  entity_type,
  ecosystem_org_id,
  action,
  status,
  attempts,
  error_message,
  created_at
FROM ecosystem_sync_queue
WHERE status = 'pending'
ORDER BY created_at ASC;
```

Check failed syncs:
```sql
SELECT * FROM ecosystem_sync_queue
WHERE status = 'failed'
ORDER BY last_attempt_at DESC;
```

### Troubleshooting

**Queue items stuck in 'processing' status:**
```sql
-- Reset to pending if older than 10 minutes
UPDATE ecosystem_sync_queue
SET status = 'pending'
WHERE status = 'processing'
  AND last_attempt_at < NOW() - INTERVAL '10 minutes';
```

**401 Authentication Error:**
- Verify your `COLECTIVA_API_KEY` is correct and has `ecosystem:write` permission
- Check that the API key hasn't expired

**400 Bad Request:**
- Check the payload structure matches Colectiva's requirements
- Verify `ecosystem_org_id` format is correct (`plenura_*` prefix)

### Manual Retry

To manually retry a specific item:
```sql
UPDATE ecosystem_sync_queue
SET status = 'pending', attempts = 0, error_message = NULL
WHERE id = 'queue-item-uuid';
```

Then run the sync script again.

### Automation

For production, set up a cron job or scheduled task to run the sync script periodically:

```bash
# Run every 5 minutes
*/5 * * * * cd /path/to/plenura-web && npm run sync:ecosystem >> /var/log/plenura-ecosystem-sync.log 2>&1
```

Or use a cloud scheduler (Vercel Cron, GitHub Actions, etc.) to hit a webhook endpoint that triggers the sync.
