export const desktopIconOrderStorageKey = "macos-web.desktop.iconOrder.v1";

export const desktopGridMetrics = {
  rows: 6,
  cellWidth: 86,
  cellHeight: 104,
  columnGap: 20,
  rowGap: 8,
  paddingLeft: 24,
  paddingTop: 48,
};

export function resolveDesktopIconOrder(appIds: string[], storedIds: unknown): string[] {
  const validIds = new Set(appIds);
  const storedOrder = Array.isArray(storedIds) ? storedIds.filter((id): id is string => typeof id === "string" && validIds.has(id)) : [];
  const uniqueStoredOrder = Array.from(new Set(storedOrder));
  const missingIds = appIds.filter((id) => !uniqueStoredOrder.includes(id));

  return [...uniqueStoredOrder, ...missingIds];
}

export function reorderDesktopIconOrder(order: string[], draggedId: string, targetIndex: number): string[] {
  const fromIndex = order.indexOf(draggedId);
  if (fromIndex === -1) {
    return order;
  }

  const nextOrder = order.filter((id) => id !== draggedId);
  const insertionIndex = clamp(targetIndex, 0, nextOrder.length);
  nextOrder.splice(insertionIndex, 0, draggedId);

  return nextOrder;
}

export function getDesktopGridDropIndex(clientX: number, clientY: number, gridRect: DOMRect, itemCount: number) {
  const x = clientX - gridRect.left - desktopGridMetrics.paddingLeft;
  const y = clientY - gridRect.top - desktopGridMetrics.paddingTop;
  const columnStride = desktopGridMetrics.cellWidth + desktopGridMetrics.columnGap;
  const rowStride = desktopGridMetrics.cellHeight + desktopGridMetrics.rowGap;
  const column = clamp(Math.round((x - desktopGridMetrics.cellWidth / 2) / columnStride), 0, Math.ceil(itemCount / desktopGridMetrics.rows));
  const row = clamp(Math.round((y - desktopGridMetrics.cellHeight / 2) / rowStride), 0, desktopGridMetrics.rows - 1);

  return clamp(column * desktopGridMetrics.rows + row, 0, itemCount - 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
