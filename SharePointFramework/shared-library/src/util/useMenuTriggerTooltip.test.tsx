import { act, renderHook } from '@testing-library/react'
import { useMenuTriggerTooltip } from './useMenuTriggerTooltip'

/**
 * The tooltip on a menu's trigger: Fluent's own visibility while the menu is closed, hidden while
 * it is open, where a tooltip the pointer showed took the first Escape and left the menu open.
 */
describe('useMenuTriggerTooltip', () => {
  const show = (tooltip: ReturnType<typeof useMenuTriggerTooltip>, visible: boolean) =>
    act(() => tooltip.onVisibleChange(undefined, { visible }))

  it('shows and hides as Fluent asks while the menu is closed', () => {
    const { result } = renderHook(() => useMenuTriggerTooltip(false))
    expect(result.current.visible).toBe(false)
    show(result.current, true)
    expect(result.current.visible).toBe(true)
    show(result.current, false)
    expect(result.current.visible).toBe(false)
  })

  it('stays hidden while the menu is open, even when the pointer shows it', () => {
    const { result, rerender } = renderHook(({ open }) => useMenuTriggerTooltip(open), {
      initialProps: { open: false }
    })
    show(result.current, true)
    rerender({ open: true })
    expect(result.current.visible).toBe(false)
    // The menu, as it is placed, passes over the button under a resting pointer.
    show(result.current, true)
    expect(result.current.visible).toBe(false)
  })

  it('starts hidden once the menu closes: Fluent reported no pointer leaving while it was open', () => {
    const { result, rerender } = renderHook(({ open }) => useMenuTriggerTooltip(open), {
      initialProps: { open: true }
    })
    show(result.current, true)
    rerender({ open: false })
    expect(result.current.visible).toBe(false)
    // The next time the pointer or the focus comes to the button, it shows again.
    show(result.current, true)
    expect(result.current.visible).toBe(true)
  })
})
