/** The one details surface open across the status report cells, and how it was opened. */
export interface IOpenSurface {
  /** The cell's id. */
  id: string

  /** Opened by a click or a key, as a dialog that holds the focus; else by the pointer resting. */
  pinned: boolean
}

let openSurface: IOpenSurface | undefined
const listeners = new Set<() => void>()

/**
 * Calls `listener` whenever the open surface changes (`useSyncExternalStore`). A module store
 * rather than a context, and a selector per cell whose answer changes only for a cell that is
 * open, so the hub's thousands of cells are not rendered again when one opens.
 *
 * @returns The function that stops it
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** The open surface, the same object until it changes; `undefined` while none is open. */
export function getOpenSurface(): IOpenSurface | undefined {
  return openSurface
}

/** Records the surface that opened, or that none is open, and tells the cells. */
export function setOpenSurface(next?: IOpenSurface): void {
  if (next?.id === openSurface?.id && next?.pinned === openSurface?.pinned) return
  openSurface = next
  Array.from(listeners).forEach((listener) => listener())
}

/** Forgets the open surface, telling no one: the module outlives a test. */
export function resetOpenSurface(): void {
  openSurface = undefined
}
