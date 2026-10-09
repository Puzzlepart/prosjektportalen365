import { act } from '@testing-library/react'
import React, { FC, useLayoutEffect } from 'react'
import { renderReact, unmountReact } from './reactRoot'

/**
 * The one place the solutions mount React: a render shows the element, a second render into the
 * same container updates it in place (the component stays mounted), and an unmount removes it and
 * runs its clean-up. A container takes a new render after an unmount (React 18 cannot render into an
 * unmounted root, so none may be kept), and containers do not touch each other. Mounts are counted
 * in a layout effect. The calls go through `act`, which
 * React 18's `createRoot` needs: it renders after the call returns, not during it.
 */
const mounts = { count: 0 }

const Greeting: FC<{ name: string }> = ({ name }) => {
  useLayoutEffect(() => {
    mounts.count++
    return () => {
      mounts.count--
    }
  }, [])
  return <span>Hei, {name}</span>
}

afterEach(() => {
  mounts.count = 0
})

describe('renderReact and unmountReact', () => {
  it('renders into the container, and updates the same component on the next render', () => {
    const container = document.createElement('div')
    act(() => renderReact(<Greeting name='Kari' />, container))
    expect(container.textContent).toBe('Hei, Kari')
    const span = container.firstChild
    act(() => renderReact(<Greeting name='Ola' />, container))
    expect(container.textContent).toBe('Hei, Ola')
    expect(container.firstChild).toBe(span)
    expect(mounts.count).toBe(1)
    act(() => unmountReact(container))
  })

  it('unmounts what it rendered and runs its clean-up, and leaves an empty container be', () => {
    const container = document.createElement('div')
    act(() => renderReact(<Greeting name='Kari' />, container))
    act(() => unmountReact(container))
    expect(container.childNodes).toHaveLength(0)
    expect(mounts.count).toBe(0)
    expect(() => act(() => unmountReact(document.createElement('div')))).not.toThrow()
  })

  it('renders into a container again after an unmount', () => {
    const container = document.createElement('div')
    act(() => renderReact(<Greeting name='Kari' />, container))
    act(() => unmountReact(container))
    act(() => renderReact(<Greeting name='Ola' />, container))
    expect(container.textContent).toBe('Hei, Ola')
    expect(mounts.count).toBe(1)
    act(() => unmountReact(container))
  })

  it('keeps containers apart: unmounting one leaves the other mounted', () => {
    const first = document.createElement('div')
    const second = document.createElement('div')
    act(() => renderReact(<Greeting name='Kari' />, first))
    act(() => renderReact(<Greeting name='Ola' />, second))
    act(() => unmountReact(first))
    expect(first.childNodes).toHaveLength(0)
    expect(second.textContent).toBe('Hei, Ola')
    expect(mounts.count).toBe(1)
    act(() => unmountReact(second))
  })
})
