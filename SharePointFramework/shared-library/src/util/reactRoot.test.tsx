import React, { FC, useLayoutEffect } from 'react'
import { renderReact, unmountReact } from './reactRoot'

/**
 * The one place the solutions mount React: a render shows the element, a second render into the
 * same container updates it in place (the component stays mounted), and an unmount removes it and
 * runs its clean-up. Mounts are counted in a layout effect, which runs as the render returns.
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
    renderReact(<Greeting name='Kari' />, container)
    expect(container.textContent).toBe('Hei, Kari')
    const span = container.firstChild
    renderReact(<Greeting name='Ola' />, container)
    expect(container.textContent).toBe('Hei, Ola')
    expect(container.firstChild).toBe(span)
    expect(mounts.count).toBe(1)
    unmountReact(container)
  })

  it('unmounts what it rendered and runs its clean-up, and leaves an empty container be', () => {
    const container = document.createElement('div')
    renderReact(<Greeting name='Kari' />, container)
    unmountReact(container)
    expect(container.childNodes).toHaveLength(0)
    expect(mounts.count).toBe(0)
    expect(() => unmountReact(document.createElement('div'))).not.toThrow()
  })
})
