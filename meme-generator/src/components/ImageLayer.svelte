<script>
  import { Image, Group, Rect, Circle, Text } from 'svelte-konva';
  import { onMount } from 'svelte';
  import { updateLayer } from '../stores/canvasStore';

  export let layer;
  export let onSelect;

  let imageObj = null;

  function handleImageLoad(img) {
      imageObj = img;
      // Update natural dimensions in store if not set
      if (!layer.naturalWidth) {
          updateLayer(layer.id, {
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              // Initialize crop to full image if not set
              cropX: layer.cropX || 0,
              cropY: layer.cropY || 0,
              cropWidth: layer.cropWidth || img.naturalWidth,
              cropHeight: layer.cropHeight || img.naturalHeight,
              // Initialize width/height to image size if not set
              width: layer.width || img.naturalWidth,
              height: layer.height || img.naturalHeight
          });
      }
  }

  onMount(() => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = layer.src;
    img.onload = () => handleImageLoad(img);
  });

  // React to src changes if any
  $: if (layer.src && (!imageObj || imageObj.src !== layer.src)) {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.src = layer.src;
      img.onload = () => handleImageLoad(img);
  }
</script>

{#if imageObj}
  <Group
      config={{
          x: layer.x,
          y: layer.y,
          draggable: layer.draggable,
          name: layer.id,
          scaleX: layer.scaleX || 1,
          scaleY: layer.scaleY || 1,
          rotation: layer.rotation || 0
      }}
      on:click={onSelect}
      on:tap={onSelect}
      on:dragend={(e) => {
          updateLayer(layer.id, {
              x: e.target.x(),
              y: e.target.y()
          });
      }}
      on:transformend={(e) => {
          const node = e.target;
          updateLayer(layer.id, {
              x: node.x(),
              y: node.y(),
              scaleX: node.scaleX(),
              scaleY: node.scaleY(),
              rotation: node.rotation()
          });
      }}
  >
      <Image
        config={{
          image: imageObj,
          width: layer.width,
          height: layer.height,
          opacity: layer.opacity !== undefined ? layer.opacity : 1,
          globalCompositeOperation: layer.globalCompositeOperation || 'source-over',
          crop: {
              x: layer.cropX || 0,
              y: layer.cropY || 0,
              width: layer.cropWidth || (layer.naturalWidth || 100),
              height: layer.cropHeight || (layer.naturalHeight || 100)
          }
        }}
      />

      {#if layer.overlayColor}
         <Rect
             config={{
                 width: layer.width,
                 height: layer.height,
                 fill: layer.overlayColor,
                 opacity: layer.overlayOpacity || 0.5,
                 listening: false // let clicks pass through to group
             }}
         />
      {/if}

      {#if layer.isProcessing}
         <Rect
             config={{
                 width: layer.width,
                 height: layer.height,
                 fill: 'black',
                 opacity: 0.5,
                 listening: false
             }}
         />
         <Circle
             config={{
                 x: layer.width/2,
                 y: layer.height/2,
                 radius: 20,
                 fill: 'white',
                 listening: false
             }}
         />
         <!-- Simple spinner visual -->
      {/if}
  </Group>
{/if}
