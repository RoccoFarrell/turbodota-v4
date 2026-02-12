<script lang="ts">
	/**
	 * SpriteSheetAnimation component - animates through frames of a sprite sheet
	 * 
	 * Usage:
	 *   <SpriteSheetAnimation 
	 *     src="/spritesheets/video_spritesheet.png"
	 *     metadata={spriteMetadata}
	 *     fps={1}
	 *     autoplay={true}
	 *   />
	 */

	import { onMount, onDestroy } from 'svelte';
	import SpriteSheet from './SpriteSheet.svelte';

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
		video: {
			fps: number;
			startTime: number;
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
		/** Metadata object */
		metadata: SpriteMetadata;
		/** Animation FPS (defaults to metadata.video.fps) */
		fps?: number;
		/** Start playing automatically */
		autoplay?: boolean;
		/** Loop the animation */
		loop?: boolean;
		/** CSS class to apply */
		class?: string;
		/** Additional styles */
		style?: string;
		/** Callback when animation completes */
		onComplete?: () => void;
		/** Optional controls snippet - receives { play, pause, reset, toggle, isPlaying, currentFrame } */
		children?: import('svelte').Snippet<[
			{
				play: () => void;
				pause: () => void;
				reset: () => void;
				toggle: () => void;
				isPlaying: boolean;
				currentFrame: number;
			}
		]>;
	}

	let {
		src,
		metadata,
		fps,
		autoplay = false,
		loop = true,
		class: className = '',
		style = '',
		onComplete,
		children
	}: Props = $props();

	let currentFrame = $state(0);
	let isPlaying = $state(autoplay);
	let animationFrameId: number | null = $state(null);
	let lastTime = $state(0);

	const animationFps = fps ?? metadata.video.fps;
	const frameInterval = 1000 / animationFps;
	const totalFrames = metadata.spriteSheet.totalFrames;

	function play() {
		isPlaying = true;
		lastTime = performance.now();
		animate();
	}

	function pause() {
		isPlaying = false;
		if (animationFrameId != null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	}

	function reset() {
		currentFrame = 0;
		lastTime = performance.now();
	}

	function animate() {
		if (!isPlaying) return;

		const now = performance.now();
		const elapsed = now - lastTime;

		if (elapsed >= frameInterval) {
			currentFrame++;
			
			if (currentFrame >= totalFrames) {
				if (loop) {
					currentFrame = 0;
				} else {
					pause();
					onComplete?.();
					return;
				}
			}

			lastTime = now - (elapsed - frameInterval);
		}

		animationFrameId = requestAnimationFrame(animate);
	}

	function toggle() {
		if (isPlaying) {
			pause();
		} else {
			play();
		}
	}

	onMount(() => {
		if (autoplay) {
			play();
		}
	});

	onDestroy(() => {
		pause();
	});

	$effect(() => {
		if (isPlaying && animationFrameId == null) {
			animate();
		} else if (!isPlaying && animationFrameId != null) {
			pause();
		}
	});
</script>

<div class="sprite-sheet-animation {className}" style={style}>
	<SpriteSheet
		{src}
		{metadata}
		frame={currentFrame}
		class={className}
		{style}
	/>
	{#if children}
		{@render children({ play, pause, reset, toggle, isPlaying, currentFrame })}
	{/if}
</div>
