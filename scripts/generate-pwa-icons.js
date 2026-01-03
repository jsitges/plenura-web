#!/usr/bin/env node
/**
 * PWA Icon Generator for Plenura
 *
 * This script generates all required PWA icons from the logo.svg
 *
 * Prerequisites:
 *   npm install -D sharp
 *
 * Usage:
 *   node scripts/generate-pwa-icons.js
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const ICON_SIZES = [32, 72, 96, 128, 144, 152, 192, 384, 512];
const SVG_PATH = join(projectRoot, 'static/logo.svg');
const OUTPUT_DIR = join(projectRoot, 'static/icons');

async function generateIcons() {
	// Ensure output directory exists
	if (!existsSync(OUTPUT_DIR)) {
		mkdirSync(OUTPUT_DIR, { recursive: true });
	}

	// Read SVG
	const svgBuffer = readFileSync(SVG_PATH);

	console.log('Generating PWA icons for Plenura...\n');

	for (const size of ICON_SIZES) {
		const outputPath = join(OUTPUT_DIR, `icon-${size}x${size}.png`);

		await sharp(svgBuffer)
			.resize(size, size, {
				fit: 'contain',
				background: { r: 255, g: 255, b: 255, alpha: 0 }
			})
			.png()
			.toFile(outputPath);

		console.log(`  Created: icon-${size}x${size}.png`);
	}

	// Generate maskable icon with padding (safe zone)
	const maskableSize = 512;
	const safeZone = Math.floor(maskableSize * 0.1); // 10% padding
	const innerSize = maskableSize - (safeZone * 2);

	await sharp(svgBuffer)
		.resize(innerSize, innerSize, {
			fit: 'contain',
			background: { r: 255, g: 255, b: 255, alpha: 0 }
		})
		.extend({
			top: safeZone,
			bottom: safeZone,
			left: safeZone,
			right: safeZone,
			background: { r: 74, g: 124, b: 89, alpha: 1 } // #4a7c59
		})
		.png()
		.toFile(join(OUTPUT_DIR, 'icon-maskable-512x512.png'));

	console.log('  Created: icon-maskable-512x512.png');

	console.log('\nDone! Icons generated in static/icons/');
}

generateIcons().catch(console.error);
