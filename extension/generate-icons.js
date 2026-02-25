#!/usr/bin/env node
/**
 * generate-icons.js
 * Génère les icônes PNG de l'extension à partir de icons/icon.svg
 * Usage: node generate-icons.js
 * Dépendance: npm install sharp  (ou: npm install sharp --prefix /tmp/flompt-tools)
 */

const path = require('path')
const fs   = require('fs')

// Cherche sharp localement ou dans /tmp/flompt-tools
let sharp
try {
  sharp = require('sharp')
} catch {
  try {
    sharp = require('/tmp/flompt-tools/node_modules/sharp')
  } catch {
    console.error('❌ sharp introuvable. Lance: npm install sharp --prefix /tmp/flompt-tools')
    process.exit(1)
  }
}

const ICONS_DIR = path.join(__dirname, 'icons')
const SOURCE    = path.join(ICONS_DIR, 'icon.svg')

const SIZES = [16, 32, 48, 128]

async function run() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`❌ Source introuvable: ${SOURCE}`)
    process.exit(1)
  }

  console.log(`📦 Génération des icônes depuis icons/icon.svg…\n`)

  for (const size of SIZES) {
    const dest = path.join(ICONS_DIR, `icon${size}.png`)
    await sharp(SOURCE)
      .resize(size, size)
      .png()
      .toFile(dest)
    console.log(`  ✓ icon${size}.png  (${size}×${size}px)`)
  }

  console.log(`\n✅ ${SIZES.length} icônes générées dans icons/`)
}

run().catch(err => {
  console.error('❌ Erreur:', err.message)
  process.exit(1)
})
