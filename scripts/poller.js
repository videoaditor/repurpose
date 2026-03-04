#!/usr/bin/env node
/**
 * Repurpose Automation Poller
 *
 * Calls the internal poll endpoint every 15 minutes to check for new IG reels.
 * Runs as a launchd service: com.aditor.repurpose-poller
 */

const APP_URL = process.env.APP_URL || 'http://localhost:3030';
const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

async function poll() {
  const ts = new Date().toISOString();
  try {
    const res = await fetch(`${APP_URL}/api/automation/poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[${ts}] Poll failed: HTTP ${res.status} — ${text}`);
      return;
    }

    const data = await res.json();

    if (data.message) {
      console.log(`[${ts}] ${data.message}`);
      return;
    }

    console.log(
      `[${ts}] Poll complete — ${data.processed} rule(s) checked in ${data.elapsed_ms ?? '?'}ms`
    );

    if (data.summary) {
      for (const s of data.summary) {
        if (s.new_reels > 0) {
          console.log(
            `  → Rule ${s.rule_id} (${s.account}): ${s.new_reels} reel(s), ${s.posted} posted, ${s.failed} failed`
          );
        }
      }
    }
  } catch (err) {
    console.error(`[${ts}] Poll error:`, err instanceof Error ? err.message : err);
  }
}

// Run immediately on start, then repeat
(async () => {
  console.log(`[${new Date().toISOString()}] Repurpose poller started — interval: ${INTERVAL_MS / 1000}s`);
  await poll();
  setInterval(poll, INTERVAL_MS);
})();
