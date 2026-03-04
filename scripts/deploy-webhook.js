#!/usr/bin/env node
/**
 * GitHub Webhook receiver for auto-deploy.
 * On push to main → git pull, npm install, build, restart service.
 * Runs on port 3031 alongside the main app on 3030.
 */

const http = require('http');
const { execSync } = require('child_process');
const crypto = require('crypto');

const PORT = 3031;
const SECRET = 'repurpose-deploy-2026';
const PROJECT_DIR = '/Users/player/clawd/projects/repurpose';

function verifySignature(payload, signature) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  const expected = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function deploy() {
  const ts = new Date().toISOString();
  console.log(`[${ts}] Deploy triggered`);
  
  try {
    execSync('git pull origin main', { cwd: PROJECT_DIR, stdio: 'pipe', timeout: 30000 });
    console.log(`[${ts}] Git pull done`);
    
    execSync('npm install --production=false', { cwd: PROJECT_DIR, stdio: 'pipe', timeout: 60000 });
    console.log(`[${ts}] npm install done`);
    
    execSync('npx drizzle-kit push', { cwd: PROJECT_DIR, stdio: 'pipe', timeout: 30000 });
    console.log(`[${ts}] DB migration done`);
    
    execSync('rm -rf .next && npm run build', { cwd: PROJECT_DIR, stdio: 'pipe', timeout: 120000 });
    console.log(`[${ts}] Build done`);
    
    execSync('launchctl stop com.aditor.repurpose', { stdio: 'pipe' });
    setTimeout(() => {
      execSync('launchctl start com.aditor.repurpose', { stdio: 'pipe' });
      console.log(`[${ts}] Service restarted ✓`);
    }, 2000);
    
    return true;
  } catch (err) {
    console.error(`[${ts}] Deploy failed:`, err.message);
    return false;
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const sig = req.headers['x-hub-signature-256'];
      
      if (!verifySignature(body, sig)) {
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }
      
      try {
        const payload = JSON.parse(body);
        if (payload.ref === 'refs/heads/main') {
          res.writeHead(200);
          res.end('Deploying...');
          // Deploy async so we respond immediately
          setImmediate(() => deploy());
        } else {
          res.writeHead(200);
          res.end('Not main branch, skipping');
        }
      } catch {
        res.writeHead(400);
        res.end('Bad payload');
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end('ok');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Deploy webhook listening on :${PORT}`);
});
