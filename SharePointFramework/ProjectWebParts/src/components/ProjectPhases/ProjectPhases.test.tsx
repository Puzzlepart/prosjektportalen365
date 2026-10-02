// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data fetch dispatches what `fetched.data` holds; the data
// adapter and the hooks that change the phase (all reach SharePoint) are stand-ins.
const fetched: { data: any } = { data: null }
jest.mock('./useProjectPhasesDataFetch', () => ({
  useProjectPhasesDataFetch: (_props: any, dispatch: any) => {
    const { useEffect } = jest.requireActual('react')
    const { INIT_DATA } = jest.requireActual('./reducer')
    useEffect(() => {
      if (fetched.data) dispatch(INIT_DATA({ data: fetched.data }))
    }, [])
  }
}))
jest.mock('data/SPDataAdapter', () => ({
  __esModule: true,
  default: {
    portalDataService: { web: { lists: { getByTitle: () => ({}) } } },
    project: { updateChecklistItem: jest.fn() }
  }
}))
jest.mock('./useChangePhase', () => ({ useChangePhase: () => jest.fn() }))
jest.mock('./usePhaseHooks', () => ({ usePhaseHooks: () => [jest.fn(), jest.fn()] }))

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { ProjectPhases } from './ProjectPhases'
import { checklistItem, phase } from './testFixtures'

/**
 * The phase selector: the visible phases in order with the current one marked, the end phase
 * shown only near the end, the popover a phase opens with its description, checklist status and
 * the change-phase action by permission, and the dialog that action opens.
 */
const phases = [
  phase('p1', 'Konsept', { PhaseSubText: 'Ideen vurderes' }),
  phase('p2', 'Planlegge', {}, [
    checklistItem(1, 'Mandat godkjent'),
    checklistItem(2, 'Plan laget', strings.StatusClosed)
  ]),
  phase('p3', 'Gjennomføre'),
  phase('p4', 'Skjult', { ShowOnFrontpage: 'false' }),
  phase('p5', 'Avslutte', { EndPhase: 'true' })
]

function renderPhases(
  currentPhase: any,
  data: Record<string, any> = {},
  props: Record<string, any> = {}
) {
  fetched.data = {
    phases,
    currentPhase,
    userHasChangePhasePermission: true,
    phaseSitePages: [],
    ...data
  }
  render(
    <ProjectPhases
      phaseField='Fase'
      currentPhaseViewName='Gjeldende fase'
      showSubText
      subTextTruncateLength={50}
      syncPropertiesAfterPhaseChange
      useStartArrow={false}
      useEndArrow={false}
      showPhaseSitePageMessage={false}
      useDynamicHomepage={false}
      usePhaseHooks={false}
      hookUrl=''
      hookAuth=''
      useArchive={false}
      hookArchiveUrl=''
      hookArchiveAuth=''
      commentMinLength={4}
      webAbsoluteUrl='https://contoso.sharepoint.com/sites/alfa'
      {...props}
    />
  )
}

// Each phase is a list item that doubles as the popover's trigger, so it carries the button role.
const phaseItems = () =>
  Array.from(screen.getByRole('list').querySelectorAll('li')).map(
    (li) => li.querySelector('span')?.textContent
  )

// Opening a phase's popover blocked the test for over ten seconds under jsdom on a loaded machine
// (measured: the click returned at once, the next timer fired 13 s later); the popover tests get
// the time for it.
const POPOVER_TIMEOUT = 60_000

describe('ProjectPhases', () => {
  // The popover and the dialog position themselves asynchronously; a test that leaves one open
  // must unmount it and let that work finish, or it fires after the environment is torn down and
  // takes the Jest worker down with it.
  afterEach(async () => {
    cleanup()
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)))
  })

  it('lists the visible phases in order, marks the current one and shows the sub text', async () => {
    renderPhases(phases[0])
    expect(await screen.findByTitle('Konsept')).toBeInTheDocument()
    // The hidden phase is left out, and the end phase until the project is near the end.
    expect(phaseItems()).toEqual(['Konsept', 'Planlegge', 'Gjennomføre'])
    expect(screen.getByTitle('Konsept').closest('li')).toHaveClass('isCurrentPhase')
    expect(screen.getByTitle('Planlegge').closest('li')).not.toHaveClass('isCurrentPhase')
    expect(screen.getByText('Ideen vurderes')).toBeInTheDocument()
  })

  it('shows the end phase once the current phase is one of the last two', async () => {
    renderPhases(phases[2])
    await screen.findByTitle('Konsept')
    expect(phaseItems()).toEqual(['Konsept', 'Planlegge', 'Gjennomføre', 'Avslutte'])
  })

  it(
    'opens a phase in a popover with its checklist status and the change-phase action',
    async () => {
      renderPhases(phases[0])
      fireEvent.click(await screen.findByTitle('Planlegge'))
      expect(await screen.findByText('Planlegge', { selector: 'h2' })).toBeInTheDocument()
      // One open and one closed checkpoint, told through the markdown stand-in.
      expect(
        screen.getByText(format(strings.CheckPointsStatus, 1, strings.StatusOpen.toLowerCase()))
      ).toBeInTheDocument()
      expect(screen.getByText(strings.PhaseChecklistLinkText).closest('a')).not.toBeNull()
      const change = screen.getByTitle(strings.ChangePhaseText)
      expect(change).toBeEnabled()
      fireEvent.click(change)
      expect(
        await screen.findByText(format(strings.ChangePhaseDialogTitle, 'Planlegge'))
      ).toBeInTheDocument()
      expect(
        screen.getByText(format(strings.ChangePhaseDialogSubtitle, 'Konsept', 'Planlegge'))
      ).toBeInTheDocument()
    },
    POPOVER_TIMEOUT
  )

  it(
    'does not offer to change to the phase the project is in',
    async () => {
      renderPhases(phases[0])
      fireEvent.click(await screen.findByTitle('Konsept'))
      expect(await screen.findByText('Konsept', { selector: 'h2' })).toBeInTheDocument()
      expect(screen.getByTitle(strings.Aria.CurrentPhaseText)).toBeDisabled()
    },
    POPOVER_TIMEOUT
  )

  it(
    'offers no change-phase action without the permission',
    async () => {
      renderPhases(phases[0], { userHasChangePhasePermission: false })
      fireEvent.click(await screen.findByTitle('Planlegge'))
      expect(await screen.findByText('Planlegge', { selector: 'h2' })).toBeInTheDocument()
      expect(screen.queryByTitle(strings.ChangePhaseText)).toBeNull()
    },
    POPOVER_TIMEOUT
  )
})
