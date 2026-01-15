<script>
  import { onMount } from 'svelte';
  import MemeCanvas from './components/MemeCanvas.svelte';
  import PropertiesPanel from './components/PropertiesPanel.svelte';
  import { layers, selectedId, isDrawing } from './stores/canvasStore';
  import { nanoid } from 'nanoid';
  import { Type, Square, Circle, Pencil, Download, Trash2, Undo } from 'lucide-svelte';

  let innerWidth = 0;
  let innerHeight = 0;
  let memeCanvasComponent;

  onMount(() => {
      console.log("App mounted");
  });

  function addText() {
    layers.update(l => [
      ...l,
      {
        id: nanoid(),
        type: 'text',
        text: 'Sample Text',
        x: 100,
        y: 100,
        fontSize: 40,
        fill: '#ffffff',
        draggable: true
      }
    ]);
  }

  function addRect() {
    layers.update(l => [
      ...l,
      {
        id: nanoid(),
        type: 'rect',
        x: 150,
        y: 150,
        width: 100,
        height: 100,
        fill: '#ef4444', // red-500
        draggable: true
      }
    ]);
  }

  function addCircle() {
    layers.update(l => [
      ...l,
      {
        id: nanoid(),
        type: 'circle',
        x: 200,
        y: 200,
        radius: 50,
        fill: '#3b82f6', // blue-500
        draggable: true
      }
    ]);
  }

  function toggleDrawing() {
      isDrawing.update(v => !v);
      if ($isDrawing) {
          selectedId.set(null); // Deselect when starting to draw
      }
  }

  // Drag and Drop Logic
  function handleDrop(e) {
      e.preventDefault();
      const items = e.dataTransfer.items;
      if (items) {
          [...items].forEach((item) => {
              if (item.kind === 'file' && item.type.startsWith('image/')) {
                  const file = item.getAsFile();
                  const url = URL.createObjectURL(file);
                  layers.update(l => [
                      ...l,
                      {
                          id: nanoid(),
                          type: 'image',
                          src: url,
                          x: 50,
                          y: 50,
                          draggable: true
                      }
                  ]);
              }
          });
      }
  }

  function handleDragOver(e) {
      e.preventDefault();
  }

  // Keyboard Shortcuts
  function handleKeydown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
          if ($selectedId) {
             layers.update(l => l.filter(item => item.id !== $selectedId));
             selectedId.set(null);
          }
      }
  }

  // Export
  function handleExport() {
      if (!memeCanvasComponent) return;
      const stage = memeCanvasComponent.getStage();
      if (!stage) return;

      // Deselect everything before export
      const currentSelection = $selectedId;
      selectedId.set(null);

      // We need to wait for the transformer to disappear.
      // Since svelte update is reactive, let's give it a tick or just execute after small delay.
      setTimeout(() => {
          const dataURL = stage.toDataURL({ pixelRatio: 2 });
          const link = document.createElement('a');
          link.download = 'meme.png';
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Restore selection if needed
          if (currentSelection) selectedId.set(currentSelection);
      }, 100);
  }

</script>

<svelte:window bind:innerWidth bind:innerHeight on:keydown={handleKeydown} />

{#if innerWidth < 1024}
  <div class="fixed inset-0 bg-neutral-900 text-neutral-100 flex items-center justify-center z-50">
    <div class="text-center p-8">
      <h1 class="text-2xl font-bold mb-4">Desktop Only</h1>
      <p>This meme generator is designed for desktop screens.</p>
    </div>
  </div>
{:else}
  <div
    class="flex h-screen w-screen bg-neutral-900 text-neutral-100 overflow-hidden"
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    role="application"
  >
    <!-- Left Sidebar: Tools -->
    <aside class="w-16 flex flex-col items-center border-r border-neutral-800 bg-neutral-900 py-4 gap-4 z-10">
      <button class="w-10 h-10 bg-neutral-800 rounded flex items-center justify-center cursor-pointer hover:bg-neutral-700 p-0 border-0"
              on:click={addText} title="Add Text">
          <Type size={20} />
      </button>
      <button class="w-10 h-10 bg-neutral-800 rounded flex items-center justify-center cursor-pointer hover:bg-neutral-700 p-0 border-0"
              on:click={addRect} title="Add Rectangle">
          <Square size={20} />
      </button>
      <button class="w-10 h-10 bg-neutral-800 rounded flex items-center justify-center cursor-pointer hover:bg-neutral-700 p-0 border-0"
              on:click={addCircle} title="Add Circle">
          <Circle size={20} />
      </button>
      <button class="w-10 h-10 rounded flex items-center justify-center cursor-pointer p-0 border-0 {$isDrawing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-neutral-800 hover:bg-neutral-700'}"
              on:click={toggleDrawing} title="Draw">
          <Pencil size={20} />
      </button>

      <div class="flex-grow"></div>

      <button class="w-10 h-10 bg-green-800 rounded flex items-center justify-center cursor-pointer hover:bg-green-700 p-0 border-0 mb-4"
              on:click={handleExport} title="Export">
          <Download size={20} />
      </button>
    </aside>

    <!-- Center: Stage -->
    <main class="flex-grow bg-neutral-800/50 flex items-center justify-center relative overflow-hidden">
      <MemeCanvas bind:this={memeCanvasComponent} />
    </main>

    <!-- Right Sidebar: Properties -->
    <aside class="w-72 border-l border-neutral-800 bg-neutral-900 p-4 z-10 overflow-y-auto">
      <h2 class="text-sm font-bold uppercase text-neutral-500 mb-4">Properties</h2>

      {#if $selectedId}
         <PropertiesPanel />
      {:else}
         <div class="text-neutral-600 text-sm">Select an element or drop an image to start editing.</div>
      {/if}
    </aside>
  </div>
{/if}
