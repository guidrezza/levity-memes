<script>
  import { layers, selectedId } from '../stores/canvasStore';
  import { removeBg } from '../utils/aiCrop';
  import { colord } from 'colord';
  import { updateLayer } from '../stores/canvasStore';

  let selectedLayer = null;

  $: {
    if ($selectedId) {
      selectedLayer = $layers.find(l => l.id === $selectedId);
    } else {
      selectedLayer = null;
    }
  }

  function moveLayer(direction) {
      if (!selectedLayer) return;
      layers.update(items => {
          const index = items.findIndex(i => i.id === selectedLayer.id);
          if (index === -1) return items;

          const newItems = [...items];
          const item = newItems.splice(index, 1)[0];

          if (direction === 'up' && index < newItems.length) {
              newItems.splice(index + 1, 0, item);
          } else if (direction === 'down' && index > 0) {
              newItems.splice(index - 1, 0, item);
          } else if (direction === 'top') {
              newItems.push(item);
          } else if (direction === 'bottom') {
              newItems.unshift(item);
          } else {
              newItems.splice(index, 0, item);
          }
          return newItems;
      });
  }

  function deleteLayer() {
      if (!selectedLayer) return;
      layers.update(items => items.filter(i => i.id !== selectedLayer.id));
      selectedId.set(null);
  }

  async function handleAiCrop() {
      if (!selectedLayer || selectedLayer.type !== 'image') return;

      updateLayer(selectedLayer.id, { isProcessing: true });
      try {
          const newSrc = await removeBg(selectedLayer.src);
          updateLayer(selectedLayer.id, { src: newSrc });
      } catch (e) {
          alert('Failed to remove background');
      } finally {
          updateLayer(selectedLayer.id, { isProcessing: false });
      }
  }

  function handleAutoBlend() {
      if (!selectedLayer) return;
      // Mock sampling: Assume background is darkish, so we overlay a dark color
      const sampledColor = '#2a2a2a'; // neutral-800 roughly

      updateLayer(selectedLayer.id, {
          globalCompositeOperation: 'overlay',
          overlayColor: sampledColor,
          overlayOpacity: 0.5
      });
  }

</script>

{#if selectedLayer}
  <div class="flex flex-col gap-4">

    <!-- Action Buttons -->
    <div class="grid grid-cols-2 gap-2">
       <button class="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-1 rounded text-xs" on:click={() => moveLayer('up')}>Move Up</button>
       <button class="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-1 rounded text-xs" on:click={() => moveLayer('down')}>Move Down</button>
       <button class="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-1 rounded text-xs" on:click={() => moveLayer('top')}>Bring to Front</button>
       <button class="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-1 rounded text-xs" on:click={() => moveLayer('bottom')}>Send to Back</button>
       <button class="col-span-2 bg-red-900/50 hover:bg-red-900 text-red-200 p-1 rounded text-xs mt-2" on:click={deleteLayer}>Delete</button>
    </div>

    <!-- Common Properties -->
    <div class="flex flex-col gap-2">
      <label class="text-xs text-neutral-400">Opacity</label>
      <input type="range" min="0" max="1" step="0.1"
             value={selectedLayer.opacity !== undefined ? selectedLayer.opacity : 1}
             on:input={(e) => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })} />
    </div>

    <!-- Blending Mode -->
    <div class="flex flex-col gap-2">
        <label class="text-xs text-neutral-400">Blend Mode</label>
        <select class="bg-neutral-800 border border-neutral-700 p-2 rounded text-sm text-neutral-200"
                value={selectedLayer.globalCompositeOperation || 'source-over'}
                on:change={(e) => updateLayer(selectedLayer.id, { globalCompositeOperation: e.target.value })}>
            <option value="source-over">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="soft-light">Soft Light</option>
            <!-- Add others if needed -->
        </select>
    </div>

    <!-- Text Properties -->
    {#if selectedLayer.type === 'text'}
      <div class="flex flex-col gap-2">
         <label class="text-xs text-neutral-400">Text</label>
         <textarea class="bg-neutral-800 border border-neutral-700 p-2 rounded text-sm text-neutral-200"
                   rows="3"
                   value={selectedLayer.text}
                   on:input={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}></textarea>
      </div>
      <div class="flex flex-col gap-2">
         <label class="text-xs text-neutral-400">Font Size</label>
         <input type="number" class="bg-neutral-800 border border-neutral-700 p-2 rounded text-sm text-neutral-200"
                value={selectedLayer.fontSize}
                on:input={(e) => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })} />
      </div>
      <div class="flex flex-col gap-2">
         <label class="text-xs text-neutral-400">Color</label>
         <input type="color" class="bg-neutral-800 border border-neutral-700 h-8 w-full rounded cursor-pointer"
                value={selectedLayer.fill}
                on:input={(e) => updateLayer(selectedLayer.id, { fill: e.target.value })} />
      </div>
    {/if}

    <!-- Shape Properties (Rect/Circle) -->
    {#if selectedLayer.type === 'rect' || selectedLayer.type === 'circle'}
      <div class="flex flex-col gap-2">
         <label class="text-xs text-neutral-400">Fill Color</label>
         <input type="color" class="bg-neutral-800 border border-neutral-700 h-8 w-full rounded cursor-pointer"
                value={selectedLayer.fill}
                on:input={(e) => updateLayer(selectedLayer.id, { fill: e.target.value })} />
      </div>
    {/if}

    <!-- Image Properties -->
     {#if selectedLayer.type === 'image'}
       <div class="border-t border-neutral-800 pt-4 mt-2">
           <h3 class="text-sm font-bold text-neutral-500 mb-2">Image Tools</h3>

           {#if selectedLayer.naturalWidth}
             <div class="flex flex-col gap-2 mb-4">
               <label class="text-xs text-neutral-400">Crop X</label>
               <input type="range" min="0" max={selectedLayer.naturalWidth}
                      value={selectedLayer.cropX || 0}
                      on:input={(e) => updateLayer(selectedLayer.id, { cropX: parseInt(e.target.value) })} />

               <label class="text-xs text-neutral-400">Crop Y</label>
               <input type="range" min="0" max={selectedLayer.naturalHeight}
                      value={selectedLayer.cropY || 0}
                      on:input={(e) => updateLayer(selectedLayer.id, { cropY: parseInt(e.target.value) })} />

               <label class="text-xs text-neutral-400">Crop Width</label>
               <input type="range" min="0" max={selectedLayer.naturalWidth}
                      value={selectedLayer.cropWidth || selectedLayer.naturalWidth}
                      on:input={(e) => updateLayer(selectedLayer.id, { cropWidth: parseInt(e.target.value) })} />

               <label class="text-xs text-neutral-400">Crop Height</label>
               <input type="range" min="0" max={selectedLayer.naturalHeight}
                      value={selectedLayer.cropHeight || selectedLayer.naturalHeight}
                      on:input={(e) => updateLayer(selectedLayer.id, { cropHeight: parseInt(e.target.value) })} />
             </div>
           {/if}

           <h3 class="text-sm font-bold text-neutral-500 mb-2">AI & Blending</h3>
           <button class="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded text-sm mb-2 disabled:opacity-50"
                   on:click={handleAiCrop}
                   disabled={selectedLayer.isProcessing}>
               {#if selectedLayer.isProcessing}Processing...{:else}Auto Crop Subject{/if}
           </button>
           <button class="w-full bg-pink-600 hover:bg-pink-700 text-white p-2 rounded text-sm"
                   on:click={handleAutoBlend}>
               Auto Blend
           </button>

           {#if selectedLayer.overlayColor}
               <div class="flex flex-col gap-2 mt-2">
                   <label class="text-xs text-neutral-400">Overlay Color</label>
                   <input type="color" class="bg-neutral-800 border border-neutral-700 h-8 w-full rounded cursor-pointer"
                          value={selectedLayer.overlayColor}
                          on:input={(e) => updateLayer(selectedLayer.id, { overlayColor: e.target.value })} />
                   <label class="text-xs text-neutral-400">Overlay Opacity</label>
                   <input type="range" min="0" max="1" step="0.1"
                          value={selectedLayer.overlayOpacity || 0}
                          on:input={(e) => updateLayer(selectedLayer.id, { overlayOpacity: parseFloat(e.target.value) })} />
               </div>
           {/if}
       </div>
    {/if}

  </div>
{/if}
