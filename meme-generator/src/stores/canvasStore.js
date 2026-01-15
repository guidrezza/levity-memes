import { writable } from 'svelte/store';

// Array of layer objects: { id, type, x, y, attrs: {} }
export const layers = writable([]);

// ID of the currently selected layer
export const selectedId = writable(null);

// Stage dimensions
export const stageSize = writable({ width: 800, height: 600 });

// Drawing mode state
export const isDrawing = writable(false);

export function updateLayer(id, attrs) {
    layers.update(items => {
        return items.map(item => {
            if (item.id === id) {
                return { ...item, ...attrs };
            }
            return item;
        });
    });
}
