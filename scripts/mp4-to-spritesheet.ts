/**
 * Convert MP4 video to sprite sheet.
 * 
 * Usage:
 *   npx tsx scripts/mp4-to-spritesheet.ts <input.mp4> [options]
 * 
 * Options:
 *   --output <path>          Output sprite sheet path (default: <input>_spritesheet.png)
 *   --metadata <path>        Output metadata JSON path (default: <input>_spritesheet.json)
 *   --fps <number>           Extract frames per second (default: 1)
 *   --frame-width <number>   Width of each frame in sprite sheet (default: 128)
 *   --frame-height <number>  Height of each frame in sprite sheet (default: 128)
 *   --columns <number>       Number of columns in sprite sheet (default: auto-calculate)
 *   --start-time <seconds>   Start extracting from this time (default: 0)
 *   --duration <seconds>     Extract frames for this duration (default: entire video)
 *   --temp-dir <path>        Temporary directory for extracted frames (default: ./temp_frames)
 *   --transparent             Make white backgrounds transparent (default: true)
 *   --transparent-threshold   Brightness threshold 0-1 for transparency (default: 0.9)
 * 
 * Example:
 *   npx tsx scripts/mp4-to-spritesheet.ts video.mp4 --fps 2 --frame-width 256 --frame-height 256
 */

import { existsSync, mkdirSync, readdirSync, unlinkSync, rmdirSync, writeFileSync } from 'fs';
import { join, dirname, basename, extname, resolve } from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';

const scriptDir = dirname(fileURLToPath(import.meta.url));

interface Options {
	input: string;
	output?: string;
	metadata?: string;
	fps?: number;
	frameWidth?: number;
	frameHeight?: number;
	columns?: number;
	startTime?: number;
	duration?: number;
	tempDir?: string;
	transparent?: boolean;
	transparentThreshold?: number;
}

function parseArgs(): Options {
	const args = process.argv.slice(2);
	if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
		console.log(`
Usage: npx tsx scripts/mp4-to-spritesheet.ts <input.mp4> [options]

Options:
  --output <path>          Output sprite sheet path
  --metadata <path>        Output metadata JSON path
  --fps <number>           Extract frames per second (default: 1)
  --frame-width <number>   Width of each frame (default: 128)
  --frame-height <number>  Height of each frame (default: 128)
  --columns <number>       Number of columns (default: auto)
  --start-time <seconds>   Start time in seconds (default: 0)
  --duration <seconds>     Duration to extract (default: entire video)
  --temp-dir <path>        Temp directory for frames (default: ./temp_frames)
  --transparent            Make white backgrounds transparent (default: true)
  --transparent-threshold  Brightness threshold for transparency 0-1 (default: 0.9)
		`);
		process.exit(0);
	}

	const inputArg = args[0];
	if (!inputArg || inputArg.startsWith('--')) {
		console.error('Error: Please provide an input MP4 file path as the first argument.');
		console.error('Example: npx tsx scripts/mp4-to-spritesheet.ts video.mp4');
		process.exit(1);
	}

	// Check if input has .mp4 extension
	if (!inputArg.toLowerCase().endsWith('.mp4')) {
		console.warn(`Warning: Input file "${inputArg}" doesn't have .mp4 extension.`);
	}

	const options: Options = {
		input: inputArg
	};

	for (let i = 1; i < args.length; i += 2) {
		const key = args[i];
		const value = args[i + 1];

		switch (key) {
			case '--output':
				options.output = value;
				break;
			case '--metadata':
				options.metadata = value;
				break;
			case '--fps':
				options.fps = parseFloat(value);
				break;
			case '--frame-width':
				options.frameWidth = parseInt(value, 10);
				break;
			case '--frame-height':
				options.frameHeight = parseInt(value, 10);
				break;
			case '--columns':
				options.columns = parseInt(value, 10);
				break;
			case '--start-time':
				options.startTime = parseFloat(value);
				break;
			case '--duration':
				options.duration = parseFloat(value);
				break;
			case '--temp-dir':
				options.tempDir = value;
				break;
			case '--transparent':
				options.transparent = value === 'true' || value === '1' || value === '';
				break;
			case '--transparent-threshold':
				options.transparentThreshold = parseFloat(value);
				break;
			default:
				console.warn(`Unknown option: ${key}`);
		}
	}

	return options;
}

function getVideoDuration(inputPath: string): Promise<number> {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(inputPath, (err, metadata) => {
			if (err) {
				reject(err);
				return;
			}
			const duration = metadata.format.duration;
			if (duration == null) {
				reject(new Error('Could not determine video duration'));
				return;
			}
			resolve(duration);
		});
	});
}

async function processFrameForTransparency(
	framePath: string,
	threshold: number = 0.9
): Promise<void> {
	// Read the image
	const image = sharp(framePath);
	const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

	// Process pixels: convert white/light pixels to transparent
	const pixels = new Uint8Array(data);
	for (let i = 0; i < pixels.length; i += 4) {
		const r = pixels[i];
		const g = pixels[i + 1];
		const b = pixels[i + 2];

		// Calculate brightness (0-1) - average of RGB values
		const brightness = (r + g + b) / (3 * 255);
		
		// Also check if all RGB channels are high (more accurate white detection)
		const isWhite = r >= threshold * 255 && g >= threshold * 255 && b >= threshold * 255;

		// If pixel is white/light (above threshold), make it transparent
		if (brightness >= threshold || isWhite) {
			pixels[i + 3] = 0; // Set alpha to 0 (transparent)
		}
	}

	// Write back the processed image
	await sharp(pixels, {
		raw: {
			width: info.width,
			height: info.height,
			channels: 4
		}
	})
		.png()
		.toFile(framePath);
}

function extractFrames(
	inputPath: string,
	tempDir: string,
	fps: number,
	frameWidth: number,
	frameHeight: number,
	startTime: number,
	duration?: number
): Promise<string[]> {
	return new Promise((resolve, reject) => {
		if (!existsSync(tempDir)) {
			mkdirSync(tempDir, { recursive: true });
		}

		const outputPattern = join(tempDir, 'frame_%04d.png');
		
		let command = ffmpeg(inputPath)
			.outputOptions([
				`-vf`, `fps=${fps},scale=${frameWidth}:${frameHeight}`,
				`-start_number`, '0',
				`-q:v`, '2' // High quality
			])
			.output(outputPattern);

		if (startTime > 0) {
			command = command.seekInput(startTime);
		}

		if (duration != null) {
			command = command.duration(duration);
		}

		command
			.on('start', (commandLine) => {
				console.log('FFmpeg command:', commandLine);
			})
			.on('progress', (progress) => {
				if (progress.percent != null) {
					process.stdout.write(`\rExtracting frames: ${Math.round(progress.percent)}%`);
				}
			})
			.on('end', async () => {
				console.log('\nFrame extraction complete');
				const frames = readdirSync(tempDir)
					.filter(f => f.endsWith('.png'))
					.sort()
					.map(f => join(tempDir, f));
				resolve(frames);
			})
			.on('error', (err) => {
				reject(err);
			})
			.run();
	});
}

function createSpriteSheet(
	framePaths: string[],
	outputPath: string,
	frameWidth: number,
	frameHeight: number,
	columns?: number
): Promise<{ width: number; height: number; rows: number; cols: number }> {
	return new Promise(async (resolve, reject) => {
		try {
			const numFrames = framePaths.length;
			const cols = columns ?? Math.ceil(Math.sqrt(numFrames));
			const rows = Math.ceil(numFrames / cols);

			const spriteWidth = cols * frameWidth;
			const spriteHeight = rows * frameHeight;

			console.log(`Creating sprite sheet: ${cols}×${rows} (${spriteWidth}×${spriteHeight}px)`);

			// Create a blank canvas
			const canvas = sharp({
				create: {
					width: spriteWidth,
					height: spriteHeight,
					channels: 4,
					background: { r: 0, g: 0, b: 0, alpha: 0 }
				}
			});

			// Composite all frames onto the canvas
			const composites = [];
			for (let i = 0; i < framePaths.length; i++) {
				const row = Math.floor(i / cols);
				const col = i % cols;
				const x = col * frameWidth;
				const y = row * frameHeight;

				composites.push({
					input: framePaths[i],
					left: x,
					top: y
				});
			}

			await canvas.composite(composites).png().toFile(outputPath);

			resolve({ width: spriteWidth, height: spriteHeight, rows, cols });
		} catch (err) {
			reject(err);
		}
	});
}

function generateMetadata(
	framePaths: string[],
	spriteInfo: { width: number; height: number; rows: number; cols: number },
	frameWidth: number,
	frameHeight: number,
	fps: number,
	startTime: number
): Record<string, unknown> {
	const frames = framePaths.map((_, index) => {
		const row = Math.floor(index / spriteInfo.cols);
		const col = index % spriteInfo.cols;
		const x = col * frameWidth;
		const y = row * frameHeight;
		const time = startTime + index / fps;

		return {
			index,
			time,
			x,
			y,
			width: frameWidth,
			height: frameHeight
		};
	});

	return {
		spriteSheet: {
			width: spriteInfo.width,
			height: spriteInfo.height,
			rows: spriteInfo.rows,
			columns: spriteInfo.cols,
			frameWidth,
			frameHeight,
			totalFrames: framePaths.length
		},
		video: {
			fps,
			startTime
		},
		frames
	};
}

function cleanup(tempDir: string): void {
	if (existsSync(tempDir)) {
		const files = readdirSync(tempDir);
		for (const file of files) {
			unlinkSync(join(tempDir, file));
		}
		rmdirSync(tempDir);
		console.log('Cleaned up temporary files');
	}
}

async function main() {
	const options = parseArgs();

	// Set defaults - output to static/spritesheets/ directory
	const inputPath = resolve(options.input);
	const inputBasename = basename(inputPath, extname(inputPath));
	const spritesheetsDir = join(scriptDir, '..', 'static', 'spritesheets');
	
	// Ensure spritesheets directory exists
	if (!existsSync(spritesheetsDir)) {
		mkdirSync(spritesheetsDir, { recursive: true });
		console.log(`Created directory: ${spritesheetsDir}`);
	}
	
	const outputPath = options.output ?? join(spritesheetsDir, `${inputBasename}_spritesheet.png`);
	const metadataPath = options.metadata ?? join(spritesheetsDir, `${inputBasename}_spritesheet.json`);
	const fps = options.fps ?? 1;
	const frameWidth = options.frameWidth ?? 128;
	const frameHeight = options.frameHeight ?? 128;
	const startTime = options.startTime ?? 0;
	const tempDir = options.tempDir ?? join(scriptDir, 'temp_frames');
	const makeTransparent = options.transparent !== false; // Default to true
	const transparentThreshold = options.transparentThreshold ?? 0.9;

	// Validate input
	if (!existsSync(inputPath)) {
		console.error(`Error: Input file not found: ${inputPath}`);
		process.exit(1);
	}

	console.log(`Input: ${inputPath}`);
	console.log(`Output: ${outputPath}`);
	console.log(`Metadata: ${metadataPath}`);
	console.log(`FPS: ${fps}, Frame size: ${frameWidth}×${frameHeight}px`);

	try {
		// Get video duration if needed
		let duration = options.duration;
		if (duration == null) {
			const videoDuration = await getVideoDuration(inputPath);
			duration = videoDuration - startTime;
			console.log(`Video duration: ${videoDuration}s, extracting from ${startTime}s for ${duration}s`);
		}

		// Extract frames
		const framePaths = await extractFrames(
			inputPath,
			tempDir,
			fps,
			frameWidth,
			frameHeight,
			startTime,
			duration
		);

		if (framePaths.length === 0) {
			throw new Error('No frames extracted');
		}

		console.log(`Extracted ${framePaths.length} frames`);

		// Process frames for transparency if requested
		if (makeTransparent) {
			console.log(`Processing frames for transparency (threshold: ${transparentThreshold})...`);
			for (let i = 0; i < framePaths.length; i++) {
				await processFrameForTransparency(framePaths[i], transparentThreshold);
				if ((i + 1) % 10 === 0 || i === framePaths.length - 1) {
					process.stdout.write(`\rProcessed ${i + 1}/${framePaths.length} frames`);
				}
			}
			console.log('\nTransparency processing complete');
		}

		// Create sprite sheet
		const spriteInfo = await createSpriteSheet(
			framePaths,
			outputPath,
			frameWidth,
			frameHeight,
			options.columns
		);

		// Generate metadata
		const metadata = generateMetadata(
			framePaths,
			spriteInfo,
			frameWidth,
			frameHeight,
			fps,
			startTime
		);

		writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

		const relativeOutputPath = outputPath.replace(join(scriptDir, '..') + '\\', '').replace(join(scriptDir, '..') + '/', '');
		const relativeMetadataPath = metadataPath.replace(join(scriptDir, '..') + '\\', '').replace(join(scriptDir, '..') + '/', '');
		
		console.log(`\n✓ Sprite sheet created: ${outputPath}`);
		console.log(`✓ Metadata saved: ${metadataPath}`);
		console.log(`\nSprite sheet info:`);
		console.log(`  Size: ${spriteInfo.width}×${spriteInfo.height}px`);
		console.log(`  Layout: ${spriteInfo.cols} columns × ${spriteInfo.rows} rows`);
		console.log(`  Frame size: ${frameWidth}×${frameHeight}px`);
		console.log(`  Total frames: ${framePaths.length}`);
		console.log(`\n📝 Usage:`);
		console.log(`  CSS: background-image: url('/${relativeOutputPath}');`);
		console.log(`  Or use the SpriteSheet component with metadata from: /${relativeMetadataPath}`);

		// Cleanup
		cleanup(tempDir);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.error('\nError:', errorMessage);
		
		// Provide helpful installation instructions for FFmpeg errors
		if (errorMessage.includes('ffprobe') || errorMessage.includes('ffmpeg') || errorMessage.includes('Cannot find')) {
			console.error('\n⚠️  FFmpeg is not installed or not found in your PATH.');
			console.error('\nTo install FFmpeg on Windows:');
			console.error('  1. Using Chocolatey (recommended):');
			console.error('     choco install ffmpeg');
			console.error('  2. Using Scoop:');
			console.error('     scoop install ffmpeg');
			console.error('  3. Manual installation:');
			console.error('     - Download from https://ffmpeg.org/download.html');
			console.error('     - Extract and add the bin folder to your PATH');
			console.error('     - Restart your terminal after installation');
			console.error('\nAfter installation, verify with: ffmpeg -version');
		}
		
		cleanup(tempDir);
		process.exit(1);
	}
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
