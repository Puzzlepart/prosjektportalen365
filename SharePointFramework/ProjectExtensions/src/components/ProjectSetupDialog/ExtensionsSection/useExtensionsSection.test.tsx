import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { ProjectSetupDialogContext } from '../context'
import { useExtensionsSection } from './useExtensionsSection'
import { announced } from 'pp365-jest-config/lib/announce'

/** Minimal selectable extension with optional template requirements. */
const item = (key: string, text: string, mandatory = false) =>
  ({ key, text, subText: '', hidden: false, isMandatoryForTemplate: () => mandatory }) as any

/** Exposes the hook's sorted items and visible selection count. */
const Probe: React.FC = () => {
  const { items, countText, showSearch } = useExtensionsSection()
  return (
    <>
      <div data-testid='items'>{items.map((i) => i.text).join('|')}</div>
      <div data-testid='count'>{countText}</div>
      <div data-testid='search'>{showSearch ? 'search' : 'no search'}</div>
    </>
  )
}

function renderProbe(all: any[], selected: any[]) {
  render(
    <ProjectSetupDialogContext.Provider
      value={
        {
          props: { data: { extensions: all } },
          state: { selectedTemplate: {}, selectedExtensions: selected },
          dispatch: jest.fn()
        } as any
      }
    >
      <Probe />
    </ProjectSetupDialogContext.Provider>
  )
}

describe('useExtensionsSection', () => {
  it('lists the mandatory items first, then the selected, then the rest, each in title order', () => {
    const sierra = item('s1', 'Sierra')
    const bravo = item('s2', 'Bravo')
    renderProbe(
      [
        item('r2', 'Zulu'),
        item('m2', 'Mike', true),
        sierra,
        item('r1', 'Echo'),
        item('m1', 'Alfa', true),
        bravo
      ],
      [sierra, bravo]
    )
    expect(screen.getByTestId('items')).toHaveTextContent('Alfa|Mike|Bravo|Sierra|Echo|Zulu')
    expect(screen.getByTestId('count')).toHaveTextContent('2 av 6 valgt')
  })

  it('counts the selected of those listed, and not the hidden ones', () => {
    const alfa = item('a', 'Alfa')
    const hidden = { ...item('h', 'Skjult'), hidden: true }
    renderProbe([alfa, item('b', 'Bravo'), hidden], [alfa, hidden])
    expect(screen.getByTestId('count')).toHaveTextContent('1 av 2 valgt')
  })

  it('leaves out hidden items', () => {
    renderProbe([item('a', 'Alfa'), { ...item('h', 'Skjult'), hidden: true }], [])
    expect(screen.getByTestId('items')).toHaveTextContent('Alfa')
    expect(screen.getByTestId('items')).not.toHaveTextContent('Skjult')
  })

  it('offers a search only for more than eight items', () => {
    const nine = 'ABCDEFGHI'.split('').map((letter) => item(letter, `Element ${letter}`))
    renderProbe(nine.slice(0, 8), [])
    expect(screen.getByTestId('search')).toHaveTextContent('no search')
    cleanup()
    renderProbe(nine, [])
    expect(screen.getByTestId('search')).toHaveTextContent('search')
  })

  it('keeps the items where they are when one is selected, so none moves away under the pointer', () => {
    const all = [item('a', 'Alfa'), item('b', 'Bravo'), item('c', 'Charlie')]
    const value = (selected: any[]) =>
      ({
        props: { data: { extensions: all } },
        state: { selectedTemplate: { id: 1 }, selectedExtensions: selected },
        dispatch: jest.fn()
      }) as any
    const { rerender } = render(
      <ProjectSetupDialogContext.Provider value={value([])}>
        <Probe />
      </ProjectSetupDialogContext.Provider>
    )
    rerender(
      <ProjectSetupDialogContext.Provider value={value([all[2]])}>
        <Probe />
      </ProjectSetupDialogContext.Provider>
    )
    expect(screen.getByTestId('items')).toHaveTextContent('Alfa|Bravo|Charlie')
    expect(screen.getByTestId('count')).toHaveTextContent('1 av 3 valgt')
  })

  it('lists nothing while no template is chosen, or a cloud template is still read', () => {
    render(
      <ProjectSetupDialogContext.Provider
        value={
          {
            props: { data: { extensions: [item('a', 'Alfa')] } },
            state: { selectedTemplate: { id: 3, isCloudTemplate: true }, selectedExtensions: [] },
            dispatch: jest.fn()
          } as any
        }
      >
        <Probe />
      </ProjectSetupDialogContext.Provider>
    )
    expect(screen.getByTestId('items')).toBeEmptyDOMElement()
  })

  it('tells how many items a search leaves (WCAG 4.1.3)', async () => {
    /** Triggers a search through the real hook to exercise result announcements. */
    const Search: React.FC = () => {
      const { onSearch } = useExtensionsSection()
      return <button onClick={() => onSearch('ech')}>Søk</button>
    }
    render(
      <AriaLiveAnnouncer>
        <ProjectSetupDialogContext.Provider
          value={
            {
              props: {
                data: { extensions: [item('r1', 'Echo'), item('r2', 'Zulu'), item('r3', 'Alfa')] }
              },
              state: { selectedTemplate: {}, selectedExtensions: [] },
              dispatch: jest.fn()
            } as any
          }
        >
          <Search />
        </ProjectSetupDialogContext.Provider>
      </AriaLiveAnnouncer>
    )
    fireEvent.click(screen.getByText('Søk'))
    await waitFor(() => expect(announced()).toContain(format(strings.SearchResultsCount, 1, 3)), {
      timeout: 2000
    })
  })
})
