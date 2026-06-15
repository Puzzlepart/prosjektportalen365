import { useEffect, useRef, useState } from 'react'
import React from 'react'

export type ColumnWidths = Record<string, number>

export function useColumnResize() {
  const [widths, setWidths] = useState<ColumnWidths>({})
  const initialized = useRef(false)
  const dragging = useRef<{ key: string; startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      document.body.style.cursor = 'col-resize'
      setWidths(prev => ({
        ...prev,
        [dragging.current!.key]: Math.max(60, dragging.current!.startWidth + (e.clientX - dragging.current!.startX))
      }))
    }
    const onMouseUp = () => {
      if (dragging.current) document.body.style.cursor = ''
      dragging.current = null
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const startResize = (key: string, e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const th = (e.currentTarget as HTMLElement).parentElement as HTMLTableCellElement
    const startWidth = th.offsetWidth

    if (!initialized.current) {
      initialized.current = true
      const tr = th.parentElement as HTMLTableRowElement
      const snapshot: ColumnWidths = {}
      for (const header of Array.from(tr.querySelectorAll<HTMLElement>('[data-col-key]'))) {
        const k = header.dataset.colKey
        if (k) snapshot[k] = (header as HTMLTableCellElement).offsetWidth
      }
      setWidths(snapshot)
    }

    dragging.current = { key, startX: e.clientX, startWidth }
  }

  return { widths, startResize }
}
