import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import strings from 'ProjectExtensionsStrings'
import { ContentConfigType, format } from 'pp365-shared-library'
import * as React from 'react'
import { ProjectSetupValidation } from '../../../extensions/projectSetup/types'
import { ProjectSetupDialogContext } from '../context'
import { useContentConfigSection } from './useContentConfigSection'
import { announced } from 'pp365-jest-config/lib/announce'

/** Minimal selectable content configuration with optional template requirements. */
const item = (key: string, text: string, mandatory = false) =>
  ({ key, text, subText: '', hidden: false, isMandatoryForTemplate: () => mandatory }) as any

/** Exposes the hook's sorted items and visible selection count. */
const Probe: React.FC = () => {
  const { items, countText, showSearch } = useContentConfigSection()
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
          props: { data: { contentConfig: all } },
          state: { selectedTemplate: {}, selectedContentConfig: selected },
          dispatch: jest.fn()
        } as any
      }
    >
      <Probe />
    </ProjectSetupDialogContext.Provider>
  )
}

describe('useContentConfigSection', () => {
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

  it('marks the list content the project has from an earlier run, and neither locks nor forces it', () => {
    const dispatch = jest.fn()
    /** Exercises clearing selection while required, previously unprovisioned content remains. */
    const Picker: React.FC = () => {
      const { addedKeys, onSelectionChange } = useContentConfigSection()
      return (
        <button onClick={() => onSelectionChange([])}>
          {addedKeys.size > 0 ? 'Noe er lagt til' : 'Ingenting er lagt til'}
        </button>
      )
    }
    render(
      <ProjectSetupDialogContext.Provider
        value={
          {
            props: {
              data: {
                contentConfig: [
                  item('m1', 'Fasesjekkpunkter', true),
                  item('m2', 'Planneroppgaver', true)
                ],
                addedListContent: 'Fasesjekkpunkter'
              }
            },
            state: { selectedTemplate: {}, selectedContentConfig: [] },
            dispatch
          } as any
        }
      >
        <Picker />
      </ProjectSetupDialogContext.Provider>
    )
    // Leaving everything out keeps only the mandatory content the project does not have.
    fireEvent.click(screen.getByText('Noe er lagt til'))
    expect(dispatch.mock.calls[0][0].payload.map(({ text }) => text)).toEqual(['Planneroppgaver'])
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
        props: { data: { contentConfig: all } },
        state: { selectedTemplate: { id: 1 }, selectedContentConfig: selected },
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
            props: { data: { contentConfig: [item('a', 'Alfa')] } },
            state: {
              selectedTemplate: { id: 3, isCloudTemplate: true },
              selectedContentConfig: []
            },
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
      const { onSearch } = useContentConfigSection()
      return <button onClick={() => onSearch('ech')}>Søk</button>
    }
    render(
      <AriaLiveAnnouncer>
        <ProjectSetupDialogContext.Provider
          value={
            {
              props: {
                data: {
                  contentConfig: [item('r1', 'Echo'), item('r2', 'Zulu'), item('r3', 'Alfa')]
                }
              },
              state: { selectedTemplate: {}, selectedContentConfig: [] },
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

  it('says on the selected Planner content that the membership is not registered, until asked again it is', async () => {
    const planner = { ...item('p', 'Planneroppgaver'), type: ContentConfigType.Planner }
    const list = item('l', 'Fasesjekkpunkter')
    const onCheckGroupMembership = jest.fn().mockResolvedValueOnce(false).mockResolvedValue(true)
    /** Shows which items carry the message, and asks again. */
    const Membership: React.FC = () => {
      const { plannerKeys, onCheckMembership, membershipCheckFailed } = useContentConfigSection()
      return (
        <>
          <div data-testid='planner'>{[...plannerKeys].join('|')}</div>
          <div data-testid='failed'>{membershipCheckFailed ? 'failed' : ''}</div>
          <button onClick={onCheckMembership}>Sjekk</button>
        </>
      )
    }
    render(
      <AriaLiveAnnouncer>
        <ProjectSetupDialogContext.Provider
          value={
            {
              props: {
                data: { contentConfig: [planner, list] },
                validation: ProjectSetupValidation.UserNotGroupMember,
                onCheckGroupMembership
              },
              state: { selectedTemplate: { id: 1 }, selectedContentConfig: [planner, list] },
              dispatch: jest.fn()
            } as any
          }
        >
          <Membership />
        </ProjectSetupDialogContext.Provider>
      </AriaLiveAnnouncer>
    )
    expect(screen.getByTestId('planner')).toHaveTextContent('p')
    fireEvent.click(screen.getByText('Sjekk'))
    await waitFor(() => expect(screen.getByTestId('failed')).toHaveTextContent('failed'))
    expect(screen.getByTestId('planner')).toHaveTextContent('p')
    fireEvent.click(screen.getByText('Sjekk'))
    await waitFor(() => expect(screen.getByTestId('planner')).toBeEmptyDOMElement())
    await waitFor(() => expect(announced()).toContain(strings.PlannerMembershipConfirmedText), {
      timeout: 2000
    })
  })

  it('says nothing of the membership when the user is a member, or no Planner content is selected', () => {
    const planner = { ...item('p', 'Planneroppgaver'), type: ContentConfigType.Planner }
    /** Shows which items carry the message. */
    const Membership: React.FC = () => (
      <div data-testid='planner'>{[...useContentConfigSection().plannerKeys].join('|')}</div>
    )
    const value = (validation: ProjectSetupValidation, selected: any[]) =>
      ({
        props: { data: { contentConfig: [planner] }, validation },
        state: { selectedTemplate: { id: 1 }, selectedContentConfig: selected },
        dispatch: jest.fn()
      }) as any
    render(
      <ProjectSetupDialogContext.Provider value={value(ProjectSetupValidation.Ready, [planner])}>
        <Membership />
      </ProjectSetupDialogContext.Provider>
    )
    expect(screen.getByTestId('planner')).toBeEmptyDOMElement()
    cleanup()
    render(
      <ProjectSetupDialogContext.Provider
        value={value(ProjectSetupValidation.UserNotGroupMember, [])}
      >
        <Membership />
      </ProjectSetupDialogContext.Provider>
    )
    expect(screen.getByTestId('planner')).toBeEmptyDOMElement()
  })
})
