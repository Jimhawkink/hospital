const fs = require('fs');
const path = require('path');

// Go up from scripts/ to frontend/ then to backend/
const source = path.resolve(__dirname, '../../backend/src');
const dest = path.resolve(__dirname, '../src/backend_mirror');

console.log(`[Copy-Backend] Syncing from ${source} to ${dest}...`);

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

try {
    if (fs.existsSync(source)) {
        // Clear destination if exists to ensure freshness
        if (fs.existsSync(dest)) {
            fs.rmSync(dest, { recursive: true, force: true });
        }
        copyDir(source, dest);
        console.log('[Copy-Backend] Success.');
    } else {
        console.warn(`[Copy-Backend] WARNING: Source directory ${source} not found.`);
        // Don't fail if we are just installing in a context where backend doesn't exist (e.g. docker optimization)
        // But for Vercel Monorepo it should exist.
    }
} catch (e) {
    console.error('[Copy-Backend] Error:', e);
    process.exit(1);
}
