<script lang="ts">
	/**
	 * SpriteSheet component - renders a single frame from a sprite sheet
	 * 
	 * Usage:
	 *   <SpriteSheet 
	 *     src="/spritesheets/video_spritesheet.png"
	 *     frame={0}
	 *     frameWidth={128}
	 *     frameHeight={128}
	 *     columns={10}
	 *   />
	 * 
	 * Or with metadata:
	 *   <SpriteSheet 
	 *     metadata={spriteMetadata}
	 *     frame={5}
	 *   />
	 */

	interface SpriteMetadata {
		spriteSheet: {
			width: number;
			height: number;
			rows: number;
			columns: number;
			frameWidth: number;
			frameHeight: number;
			totalFrames: number;
		};
		frames: Array<{
			index: number;
			time: number;
			x: number;
			y: number;
			width: number;
			height: number;
		}>;
	}

	interface Props {
		/** Path to sprite sheet image */
		src?: string;
		/** Frame index to display (0-based) */
		frame: number;
		/** Frame width in pixels */
		frameWidth?: number;
		/** Frame height in pixels */
		frameHeight?: number;
		/** Number of columns in sprite sheet */
		columns?: number;
		/** Metadata object (alternative to individual props) */
		metadata?: SpriteMetadata;
		/** CSS class to apply */
		class?: string;
		/** Additional styles */
		style?: string;
	}

	let {
		src,
		frame = 0,
		frameWidth,
		frameHeight,
		columns,
		metadata,
		class: className = '',
		style = ''
	}: Props = $props();

	// Extract dimensions from metadata if provided
	const actualFrameWidth = $derived(metadata?.spriteSheet.frameWidth ?? frameWidth ?? 128);
	const actualFrameHeight = $derived(metadata?.spriteSheet.frameHeight ?? frameHeight ?? 128);
	const actualColumns = $derived(metadata?.spriteSheet.columns ?? columns ?? 1);

	// Calculate position
	const row = $derived(Math.floor(frame / actualColumns));
	const col = $derived(frame % actualColumns);
	const x = $derived(col * actualFrameWidth);
	const y = $derived(row * actualFrameHeight);
	const backgroundPosition = $derived(`-${x}px -${y}px`);

	const spriteSheetWidth = $derived(metadata?.spriteSheet.width);
	const spriteSheetHeight = $derived(metadata?.spriteSheet.height);

	const computedStyle = $derived.by(() => {
		let baseStyle = `width: ${actualFrameWidth}px; height: ${actualFrameHeight}px; background-position: ${backgroundPosition}; background-repeat: no-repeat; display: inline-block;`;
		if (src) {
			baseStyle += ` background-image: url('${src}');`;
		}
		if (spriteSheetWidth && spriteSheetHeight) {
			baseStyle += ` background-size: ${spriteSheetWidth}px ${spriteSheetHeight}px;`;
		}
		return baseStyle;
	});
</script>

<div
	class="sprite-sheet {className}"
	style="{computedStyle} {style}"
	data-frame={frame}
></div>
