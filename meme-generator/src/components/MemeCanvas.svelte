<script>
  import { onMount, tick } from 'svelte';
  import { Stage, Layer, Transformer, Image as KonvaImage, Text, Rect, Circle, Line } from 'svelte-konva';
  import { layers, selectedId, stageSize, isDrawing, updateLayer } from '../stores/canvasStore';
  import { nanoid } from 'nanoid';

  let stageWidth = 800;
  let stageHeight = 600;
  let container;
  let stage;

  onMount(() => {
    console.log("MemeCanvas mounted");
    const updateSize = () => {
      if (container) {
        stageWidth = container.clientWidth;
        stageHeight = container.clientHeight;
        console.log("Stage size updated:", stageWidth, stageHeight);
        stageSize.set({ width: stageWidth, height: stageHeight });
      } else {
        console.log("Container not found");
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  });

  // Transformer logic
  let transformer;
  let isDrawingActive = false;
  let currentLineId = null;

  $: isDrawingActive = $isDrawing;

  function handleStageClick(e) {
    if (isDrawingActive) return;

    if (e.target === e.target.getStage()) {
      selectedId.set(null);
      if (transformer) {
        transformer.nodes([]);
      }
      return;
    }
  }

  function handleSelect(id) {
    if (isDrawingActive) return;
    selectedId.set(id);
  }

  function handleMouseDown(e) {
      if (!isDrawingActive) return;

      const pos = e.target.getStage().getPointerPosition();
      const id = nanoid();
      currentLineId = id;

      layers.update(l => [
          ...l,
          {
              id,
              type: 'line',
              points: [pos.x, pos.y],
              stroke: '#ffffff',
              strokeWidth: 5,
              draggable: false
          }
      ]);
  }

  function handleMouseMove(e) {
      if (!isDrawingActive || !currentLineId) return;

      const pos = e.target.getStage().getPointerPosition();

      layers.update(l => {
          const newLayers = [...l];
          const lineIndex = newLayers.findIndex(item => item.id === currentLineId);
          if (lineIndex !== -1) {
              const line = newLayers[lineIndex];
              // We need to create a new array for points to trigger update
              const newPoints = [...line.points, pos.x, pos.y];
              newLayers[lineIndex] = { ...line, points: newPoints };
          }
          return newLayers;
      });
  }

  function handleMouseUp(e) {
      if (!isDrawingActive) return;
      currentLineId = null;
  }

  // Reactive statement to update transformer when selection changes
  $: if (transformer && $selectedId && !isDrawingActive) {
    const stage = transformer.getStage();
    if (stage) {
        const selectedNode = stage.findOne('.' + $selectedId);
        if (selectedNode) {
            transformer.nodes([selectedNode]);
        } else {
            transformer.nodes([]);
        }
    }
  } else if (transformer) {
    transformer.nodes([]);
  }

  export function getStage() {
      return stage.getStage();
  }

</script>

<div class="w-full h-full" bind:this={container}
     on:dragover|preventDefault
     on:drop|preventDefault
     role="region" aria-label="Canvas Stage">
  <Stage bind:this={stage}
         config={{ width: stageWidth, height: stageHeight }}
         on:click={handleStageClick}
         on:mousedown={handleMouseDown}
         on:mousemove={handleMouseMove}
         on:mouseup={handleMouseUp}
         on:touchstart={handleMouseDown}
         on:touchmove={handleMouseMove}
         on:touchend={handleMouseUp}
         >
    <Layer>
      {#each $layers as layer (layer.id)}
        {#if layer.type === 'image'}
           <ImageLayer {layer} onSelect={() => handleSelect(layer.id)} />
        {:else if layer.type === 'text'}
           <Text
             config={{
               x: layer.x,
               y: layer.y,
               text: layer.text,
               fontSize: layer.fontSize || 24,
               fontFamily: layer.fontFamily || 'Arial',
               fill: layer.fill || 'white',
               draggable: layer.draggable && !isDrawingActive,
               name: layer.id,
               scaleX: layer.scaleX || 1,
               scaleY: layer.scaleY || 1,
               rotation: layer.rotation || 0
             }}
             on:click={() => handleSelect(layer.id)}
             on:tap={() => handleSelect(layer.id)}
             on:dragend={(e) => {
               updateLayer(layer.id, { x: e.target.x(), y: e.target.y() });
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
           />
        {:else if layer.type === 'rect'}
           <Rect
             config={{
                x: layer.x,
                y: layer.y,
                width: layer.width || 100,
                height: layer.height || 100,
                fill: layer.fill || 'red',
                draggable: layer.draggable && !isDrawingActive,
                name: layer.id,
                scaleX: layer.scaleX || 1,
                scaleY: layer.scaleY || 1,
                rotation: layer.rotation || 0
             }}
             on:click={() => handleSelect(layer.id)}
             on:dragend={(e) => {
               updateLayer(layer.id, { x: e.target.x(), y: e.target.y() });
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
           />
        {:else if layer.type === 'circle'}
           <Circle
             config={{
                x: layer.x,
                y: layer.y,
                radius: layer.radius || 50,
                fill: layer.fill || 'blue',
                draggable: layer.draggable && !isDrawingActive,
                name: layer.id,
                scaleX: layer.scaleX || 1,
                scaleY: layer.scaleY || 1,
                rotation: layer.rotation || 0
             }}
             on:click={() => handleSelect(layer.id)}
             on:dragend={(e) => {
               updateLayer(layer.id, { x: e.target.x(), y: e.target.y() });
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
           />
        {:else if layer.type === 'line'}
            <Line
                config={{
                    points: layer.points,
                    stroke: layer.stroke || 'white',
                    strokeWidth: layer.strokeWidth || 5,
                    tension: 0.5,
                    lineCap: 'round',
                    name: layer.id,
                    draggable: layer.draggable && !isDrawingActive
                }}
            />
        {/if}
      {/each}

      <Transformer config={{}} bind:this={transformer} />
    </Layer>
  </Stage>
</div>

<script context="module">
    import ImageLayer from './ImageLayer.svelte';
</script>
