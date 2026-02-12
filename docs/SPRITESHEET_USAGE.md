# Sprite Sheet Usage Guide

This guide explains how to use sprite sheets generated from MP4 videos in your website.

## Generating a Sprite Sheet

Use the script to convert an MP4 to a sprite sheet:

```bash
npx tsx scripts/mp4-to-spritesheet.ts path/to/video.mp4 [options]
```

The script will output:
- `static/spritesheets/{video}_spritesheet.png` - The sprite sheet image
- `static/spritesheets/{video}_spritesheet.json` - Metadata with frame positions

### Example

```bash
npx tsx scripts/mp4-to-spritesheet.ts C:\Users\bosto\Downloads\wolf.mp4 --fps 2 --frame-width 256 --frame-height 256
```

## Rendering Sprite Sheets

You have three options for rendering sprite sheets:

### Option 1: Using the SpriteSheet Component (Recommended)

Import and use the `SpriteSheet` component for static frames:

```svelte
<script>
  import SpriteSheet from '$lib/components/SpriteSheet.svelte';
  import spriteMetadata from '/spritesheets/wolf_spritesheet.json?url';
  
  // Load metadata
  let metadata = null;
  fetch(spriteMetadata).then(r => r.json()).then(m => metadata = m);
</script>

<!-- Static frame -->
<SpriteSheet 
  src="/spritesheets/wolf_spritesheet.png"
  frame={5}
  frameWidth={256}
  frameHeight={256}
  columns={10}
/>

<!-- Or with metadata -->
{#if metadata}
  <SpriteSheet 
    src="/spritesheets/wolf_spritesheet.png"
    {metadata}
    frame={5}
  />
{/if}
```

### Option 2: Using SpriteSheetAnimation Component

For animated sprite sheets:

```svelte
<script>
  import SpriteSheetAnimation from '$lib/components/SpriteSheetAnimation.svelte';
  import spriteMetadata from '/spritesheets/wolf_spritesheet.json?url';
  
  let metadata = null;
  fetch(spriteMetadata).then(r => r.json()).then(m => metadata = m);
</script>

{#if metadata}
  <SpriteSheetAnimation 
    src="/spritesheets/wolf_spritesheet.png"
    {metadata}
    fps={2}
    autoplay={true}
    loop={true}
  />
{/if}
```

### Option 3: Using CSS Classes

Use the `.sprite-sheet-frame` utility class with CSS variables:

```svelte
<div 
  class="sprite-sheet-frame"
  style="
    --sprite-src: url('/spritesheets/wolf_spritesheet.png');
    --sprite-frame: 5;
    --sprite-width: 256px;
    --sprite-height: 256px;
    --sprite-cols: 10;
    --sprite-sheet-width: 2560px;
    --sprite-sheet-height: 1280px;
  "
></div>
```

Or create a custom CSS class:

```css
.wolf-sprite {
  background-image: url('/spritesheets/wolf_spritesheet.png');
  background-repeat: no-repeat;
  display: inline-block;
  width: 256px;
  height: 256px;
  background-size: 2560px 1280px; /* Total sprite sheet size */
  /* Frame 5: column 5, row 0 */
  background-position: -1280px 0px; /* -width * col, -height * row */
}
```

## Animation Example

Here's a complete example of animating a sprite sheet:

```svelte
<script>
  import SpriteSheetAnimation from '$lib/components/SpriteSheetAnimation.svelte';
  import spriteMetadata from '/spritesheets/wolf_spritesheet.json?url';
  
  let metadata = null;
  let isPlaying = false;
  
  fetch(spriteMetadata).then(r => r.json()).then(m => metadata = m);
  
  function toggleAnimation() {
    isPlaying = !isPlaying;
  }
</script>

{#if metadata}
  <div class="sprite-container">
  <SpriteSheetAnimation 
    src="/spritesheets/wolf_spritesheet.png"
    {metadata}
    fps={metadata.video.fps}
    autoplay={isPlaying}
    loop={true}
  >
    {#snippet children({ play, pause, reset, toggle, isPlaying, currentFrame })}
      <div class="controls">
        <button on:click={toggle}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button on:click={reset}>Reset</button>
        <span>Frame: {currentFrame} / {metadata.spriteSheet.totalFrames}</span>
      </div>
    {/snippet}
  </SpriteSheetAnimation>
  </div>
{/if}

<style>
  .sprite-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
</style>
```

## Manual Frame Calculation

If you need to calculate frame positions manually:

```typescript
function getFramePosition(
  frameIndex: number,
  frameWidth: number,
  frameHeight: number,
  columns: number
) {
  const row = Math.floor(frameIndex / columns);
  const col = frameIndex % columns;
  const x = -col * frameWidth;
  const y = -row * frameHeight;
  return { x, y };
}

// Usage
const { x, y } = getFramePosition(5, 256, 256, 10);
// x = -1280, y = 0 (frame 5 is in column 5, row 0)
```

## Metadata Structure

The generated JSON metadata has this structure:

```json
{
  "spriteSheet": {
    "width": 2560,
    "height": 1280,
    "rows": 5,
    "columns": 10,
    "frameWidth": 256,
    "frameHeight": 256,
    "totalFrames": 50
  },
  "video": {
    "fps": 2,
    "startTime": 0
  },
  "frames": [
    {
      "index": 0,
      "time": 0,
      "x": 0,
      "y": 0,
      "width": 256,
      "height": 256
    },
    // ... more frames
  ]
}
```

## Tips

1. **Performance**: Sprite sheets are more performant than individual images for animations
2. **File Size**: Larger frame sizes increase file size - balance quality vs. size
3. **FPS**: Lower FPS (e.g., 1-2) works well for most animations and reduces file size
4. **Frame Count**: Consider limiting duration or FPS for very long videos
5. **CSS Variables**: Use CSS variables for dynamic frame changes without re-rendering
