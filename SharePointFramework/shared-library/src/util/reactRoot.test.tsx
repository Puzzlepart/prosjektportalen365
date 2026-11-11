import { useAnnounce } from '@fluentui/react-components'
import { act, waitFor } from '@testing-library/react'
import React, { FC, useLayoutEffect, useState } from 'react'
import { UserMessage } from '../components/UserMessage'
import { renderReact, unmountReact } from './reactRoot'
import { announced } from 'pp365-jest-config/lib/announce'

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

  describe('status messages', () => {
    // A status message follows something the user did or something that loaded, after the root
    // has mounted: the announcer's live region is made in its own effect, which runs after its
    // children's on the first render, so what a child announces while mounting waits in the
    // announcer's queue for the next message.
    const Save: FC = () => {
      const { announce } = useAnnounce()
      return <button onClick={() => announce('Lagret', { polite: true })}>Lagre</button>
    }

    const Search: FC = () => {
      const [done, setDone] = useState(false)
      return done ? (
        <UserMessage text='Ingen prosjekter funnet' />
      ) : (
        <button onClick={() => setDone(true)}>Søk</button>
      )
    }

    it('gives what it renders an announcer, so a status message reaches screen readers', async () => {
      const container = document.createElement('div')
      document.body.append(container)
      act(() => renderReact(<Save />, container))
      act(() => container.querySelector('button').click())
      await waitFor(() => expect(announced()).toContain('Lagret'))
      act(() => unmountReact(container))
      container.remove()
      // The live region goes with the root.
      expect(document.body.querySelectorAll('[aria-live]')).toHaveLength(0)
    })

    it('lets a message bar announce itself', async () => {
      const container = document.createElement('div')
      document.body.append(container)
      act(() => renderReact(<Search />, container))
      act(() => container.querySelector('button').click())
      await waitFor(() => expect(announced()).toContain('Ingen prosjekter funnet'))
      act(() => unmountReact(container))
      container.remove()
    })
  })
})
