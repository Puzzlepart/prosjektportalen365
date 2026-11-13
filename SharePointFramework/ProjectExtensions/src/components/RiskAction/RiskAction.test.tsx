// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Stand-ins preserve Fluent's event and naming contracts while
// keeping these workflow tests independent of popup layout; date inputs use the real formatter
// and parser supplied by the field.
jest.mock('@fluentui/react-components', () => {
  const base = jest.requireActual('pp365-jest-config/lib/tagPickerStandIn').withTagPickerStandIn()
  const React = jest.requireActual('react')
  const PopoverContext = React.createContext({
    open: false,
    trapFocus: false,
    toggle: (_event: any) => undefined
  })
  /** Shares controlled or internal popover state with trigger and surface stand-ins. */
  const Popover = ({ open: controlled, onOpenChange, trapFocus, children }: any) => {
    const [uncontrolled, setUncontrolled] = React.useState(false)
    const open = controlled ?? uncontrolled
    const toggle = (event: any) => {
      setUncontrolled(!open)
      onOpenChange?.(event, { open: !open })
    }
    return React.createElement(
      PopoverContext.Provider,
      { value: { open, trapFocus: !!trapFocus, toggle } },
      children
    )
  }
  /** Routes trigger clicks through the popover's state callback. */
  const PopoverTrigger = ({ children }: any) =>
    React.createElement('span', { onClick: React.useContext(PopoverContext).toggle }, children)
  /** Exposes open content with Fluent's dialog naming contract, without simulating focus trapping. */
  const PopoverSurface = ({ children, ...props }: any) => {
    const { open, trapFocus } = React.useContext(PopoverContext)
    return open
      ? React.createElement(
          'div',
          {
            role: trapFocus ? 'dialog' : undefined,
            'aria-labelledby': props['aria-labelledby']
          },
          children
        )
      : null
  }
  const pick = (onOptionSelect: any) => (event: any) => {
    const option = event.target.options[event.target.selectedIndex]
    onOptionSelect?.(event, { optionValue: option.value, optionText: option.textContent })
  }
  /** Adapts native selection changes to the separator dropdown's option callback. */
  const Dropdown = ({ disabled, defaultSelectedOptions, onOptionSelect, children }: any) =>
    React.createElement(
      'select',
      {
        'aria-label': 'Skilletegn',
        disabled,
        defaultValue: defaultSelectedOptions?.[0],
        onChange: pick(onOptionSelect)
      },
      children
    )
  /** Supplies native options to the dropdown stand-in. */
  const Option = ({ value, text, children }: any) =>
    React.createElement('option', { value: value ?? '' }, text || children)
  return { ...base, Popover, PopoverTrigger, PopoverSurface, Dropdown, Option }
})
jest.mock('@fluentui/react-datepicker-compat', () => {
  const React = jest.requireActual('react')
  /** Exercises the field's day formatter and parser through a native input. */
  const DatePicker = ({
    id,
    value,
    placeholder,
    disabled,
    formatDate,
    parseDateFromString,
    onSelectDate
  }: any) =>
    React.createElement('input', {
      id,
      placeholder,
      disabled,
      value: value ? formatDate(value) : '',
      onChange: (event: any) => onSelectDate(parseDateFromString(event.target.value))
    })
  return { __esModule: true, DatePicker }
})

import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import { RiskActionFieldCustomizerContext } from '../../extensions/riskAction/context'
import { RiskAction } from './RiskAction'
import { announced } from 'pp365-jest-config/lib/announce'

const RISK = 'Leverandøren går konkurs'
const PLANNER_TASKS = [
  { id: 'task-1', title: 'Ring leverandøren', isCompleted: '0' },
  { id: 'task-2', title: 'Avtal en reserve', isCompleted: '1' }
]
/** When the tasks were last synchronised: 1 October 2026, 10:00 in the machine's time zone. */
const UPDATED = new Date(2026, 9, 1, 10, 0).toISOString()

const adapter = {
  globalSettings: new Map<string, string>(),
  getTask: jest.fn(),
  syncTasks: jest.fn(),
  addTask: jest.fn(() => Promise.resolve({ id: 'task-9', title: 'Ny oppgave', isCompleted: '0' })),
  addTasks: jest.fn((titles: string[]) =>
    Promise.resolve({
      added: titles.map((title, index) => ({ id: `new-${index}`, title, isCompleted: '0' })),
      refused: [] as Array<{ title: string; reason: string }>
    })
  ),
  updateItem: jest.fn((tasks: any[], itemContext: any, _keep?: string[]) =>
    Promise.resolve({
      ...itemContext,
      hiddenFieldValues: { data: 'oppdatert', tasks, updated: '2026-10-02T10:00:00Z' }
    })
  ),
  clientPeoplePickerSearchUser: jest.fn((_query: string, _selected: any[]) =>
    Promise.resolve([] as any[])
  )
}

/** What Planner or SharePoint fails with when it answers with `status`. */
const httpError = (message: string, status: number) => Object.assign(new Error(message), { status })

/**
 * The risk action cell of the risk with `fieldValue` and, when it uses Planner, its tasks, under
 * the field customizer's alias for usage statistics, as the customizer renders it.
 */
function renderRiskAction(
  fieldValue: string,
  plannerTasks?: any[],
  settings: Record<string, string> = {}
) {
  adapter.globalSettings = new Map(
    Object.entries({ RiskActionPlannerNoActionsText: 'Ingen tiltak ennå', ...settings })
  )
  const itemContext = {
    id: 7,
    title: RISK,
    fieldValue,
    hiddenFieldValues: plannerTasks
      ? { data: 'tasks', tasks: plannerTasks, updated: UPDATED }
      : undefined
  }
  render(
    <TelemetryProvider component='RiskActionPlanner'>
      <AriaLiveAnnouncer>
        <RiskActionFieldCustomizerContext.Provider
          value={{ dataAdapter: adapter as any, itemContext: itemContext as any }}
        >
          <RiskAction />
        </RiskActionFieldCustomizerContext.Provider>
      </AriaLiveAnnouncer>
    </TelemetryProvider>
  )
  return itemContext
}

const button = (text: string) => screen.getByText(text).closest('button')

/**
 * `pointerEventsCheck` is off because Fluent's popup surfaces compute to `pointer-events: none`
 * under jsdom, which has no layout: the guard would reject a click the browser performs happily.
 */
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

/**
 * The shared people picker's text for a search that finds no one (`SharedLibraryStrings`
 * `PeoplePickerNoResults`, in Norwegian here): the solution has no typings for that module.
 */
const NO_PEOPLE_FOUND = 'Fant ingen personer'

/**
 * Opens the panel that adds an action to the risk, and gives it.
 */
function openNewActionPanel(): Promise<HTMLElement> {
  fireEvent.click(screen.getByText(strings.NewRiskActionPanelAddNewRiskAction))
  return screen.findByRole('dialog')
}

/**
 * Types a name into the panel's responsible picker.
 */
async function searchResponsible(panel: HTMLElement, name: string) {
  const user = setupUser()
  const input = within(panel).getByRole('combobox', { name: strings.ResponsibleFieldLabel })
  await user.click(input)
  await user.type(input, name)
  return user
}

beforeEach(() => {
  jest.clearAllMocks()
  adapter.clientPeoplePickerSearchUser.mockImplementation(() => Promise.resolve([]))
  // Usage statistics are the real ones, counting in the window's memory from nothing.
  startTestTelemetry()
})

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('RiskAction', () => {
  it('shows the actions written in the field and opens the actions for the risk from them', () => {
    renderRiskAction('Finn en reserveleverandør')
    fireEvent.click(screen.getByText('Finn en reserveleverandør'))
    expect(screen.getByText(format(strings.RiskActionPopoverTitle, RISK))).toBeInTheDocument()
    expect(screen.getByText(strings.RiskActionPopoverInfoTextNoPlanner)).toBeInTheDocument()
    expect(button(strings.NewRiskActionPanelMigrateRiskActions)).toBeEnabled()
    expect(screen.getByText(strings.NewRiskActionPanelUpdateTaskStatus)).not.toBeVisible()
  })

  it('says, as the global settings put it, that the risk has no actions yet', () => {
    renderRiskAction('')
    fireEvent.click(screen.getByText('Ingen tiltak ennå'))
    expect(screen.getByText(strings.RiskActionPopoverInfoText)).toBeInTheDocument()
    expect(button(strings.NewRiskActionPanelMigrateRiskActions)).toBeDisabled()
  })

  it('lists the Planner tasks and synchronises them on request', async () => {
    const itemContext = renderRiskAction('', PLANNER_TASKS, {
      RiskActionPlannerShowLastSyncTime: '1'
    })
    expect(screen.getByText('Ring leverandøren')).toBeInTheDocument()
    expect(screen.getByText('Avtal en reserve')).toBeInTheDocument()
    fireEvent.click(screen.getByText(strings.RiskActionFieldValueAdminButtonText))
    // In SharePoint's UI language (Norwegian when the page names none), not jsdom's en-US.
    expect(
      screen.getByText(format(strings.RiskActionPopoverLastUpdated, '01.10.2026, 10:00'))
    ).toBeVisible()
    expect(screen.getByText(strings.NewRiskActionPanelMigrateRiskActions)).not.toBeVisible()
    adapter.syncTasks.mockImplementation(() =>
      Promise.resolve({
        ...itemContext,
        hiddenFieldValues: {
          data: 'synkronisert',
          tasks: [{ id: 'task-3', title: 'Følg opp kontrakten', isCompleted: '0' }],
          updated: '2026-10-02T10:00:00Z'
        }
      })
    )
    fireEvent.click(screen.getByText(strings.NewRiskActionPanelUpdateTaskStatus))
    expect(await screen.findByText('Følg opp kontrakten')).toBeInTheDocument()
    expect(adapter.syncTasks).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }))
    expect(screen.queryByText('Ring leverandøren')).toBeNull()
  })

  it('previews a Planner task and links to it in Planner', async () => {
    adapter.getTask.mockImplementation(() =>
      Promise.resolve({
        description: 'Ring før fredag',
        startDateTime: new Date(2026, 8, 21),
        dueDateTime: new Date(2026, 9, 2),
        progress: 'Pågår',
        assignees: [{ displayName: 'Kari Nordmann', mail: 'kari@contoso.no' }],
        planId: 'plan-1'
      })
    )
    renderRiskAction('', PLANNER_TASKS)
    fireEvent.click(screen.getByText('Ring leverandøren'))
    expect(await screen.findByText('Ring før fredag')).toBeInTheDocument()
    expect(adapter.getTask).toHaveBeenCalledWith('task-1')
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument()
    expect(screen.getByText('21.09.2026')).toBeInTheDocument()
    expect(screen.getByText('02.10.2026')).toBeInTheDocument()
    // A link, which goes somewhere, where a button called window.open (WCAG 4.1.2).
    const link = screen.getByRole('link', {
      name: strings.RiskActionPlannerTaskPreviewPlannerLinkText
    })
    expect(link).toHaveAttribute(
      'href',
      'https://planner.cloud.microsoft/webui/plan/plan-1/task/task-1'
    )
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('says when a Planner task is done', async () => {
    adapter.getTask.mockImplementation(() =>
      Promise.resolve({ description: '', assignees: [], planId: '' })
    )
    renderRiskAction('', PLANNER_TASKS)
    fireEvent.click(screen.getByText('Avtal en reserve'))
    expect(
      await screen.findByText(strings.RiskActionPlannerTaskPreviewCompletedText)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: strings.RiskActionPlannerTaskPreviewPlannerLinkText })
    ).toHaveAttribute('href', 'https://tasks.office.com/home/task/task-2')
  })

  it('says that the risk has no actions yet from a button, not a message announced in every row (WCAG 4.1.3)', () => {
    renderRiskAction('')
    const empty = screen.getByRole('button', { name: 'Ingen tiltak ennå' })
    expect(empty.closest('.fui-MessageBar')).toBeNull()
    fireEvent.click(empty)
    expect(screen.getByText(strings.RiskActionPopoverInfoText)).toBeInTheDocument()
  })

  it("keeps Enter and Space on the cell's button from the list's row, and still opens the actions (WCAG 2.1.1)", () => {
    // SharePoint opened the item's form on Enter, and selected the row on Space.
    const row = jest.fn()
    document.body.addEventListener('keydown', row)
    document.body.addEventListener('keyup', row)
    try {
      renderRiskAction('', PLANNER_TASKS)
      const admin = button(strings.RiskActionFieldValueAdminButtonText)
      fireEvent.keyDown(admin, { key: 'Enter' })
      fireEvent.keyDown(admin, { key: ' ' })
      fireEvent.keyUp(admin, { key: ' ' })
      expect(row).not.toHaveBeenCalled()
      // Other keys, such as Tab, go on as before.
      fireEvent.keyDown(admin, { key: 'Tab' })
      expect(row).toHaveBeenCalledTimes(1)
      // The browser turns Enter and Space on a button into a click, which opens the actions.
      fireEvent.click(admin)
      expect(screen.getByText(format(strings.RiskActionPopoverTitle, RISK))).toBeInTheDocument()
    } finally {
      document.body.removeEventListener('keydown', row)
      document.body.removeEventListener('keyup', row)
    }
  })

  it('lists the Planner tasks, a done one named so, and keeps the focus in the actions, named by their risk (WCAG 1.3.1, 2.4.3)', () => {
    renderRiskAction('', PLANNER_TASKS)
    const list = screen.getByRole('list', { name: strings.RiskActionTasksLabel })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Avtal en reserve')).toHaveAttribute(
      'aria-label',
      format(strings.RiskActionTaskCompletedLabel, 'Avtal en reserve')
    )
    fireEvent.click(screen.getByText(strings.RiskActionFieldValueAdminButtonText))
    expect(
      screen.getByRole('dialog', { name: format(strings.RiskActionPopoverTitle, RISK) })
    ).toBeInTheDocument()
    // The time of the last synchronisation is not shown, so not there to be announced.
    expect(
      screen.queryByText(format(strings.RiskActionPopoverLastUpdated, '01.10.2026, 10:00'))
    ).toBeNull()
  })

  it('previews a Planner task in a dialog named by it, reading its people once and its properties in pairs (WCAG 1.3.1, 2.4.3)', async () => {
    adapter.getTask.mockImplementation(() =>
      Promise.resolve({
        description: 'Ring før fredag',
        startDateTime: new Date(2026, 8, 21),
        dueDateTime: new Date(2026, 9, 2),
        progress: 'Pågår',
        assignees: [{ displayName: 'Kari Nordmann', mail: 'kari@contoso.no' }],
        planId: 'plan-1'
      })
    )
    renderRiskAction('', PLANNER_TASKS)
    fireEvent.click(screen.getByText('Ring leverandøren'))
    const preview = await screen.findByRole('dialog', { name: 'Ring leverandøren' })
    await within(preview).findByText('Ring før fredag')
    expect(within(preview).getByText(strings.StartDateLabel).closest('dt')).not.toBeNull()
    expect(within(preview).getByText('21.09.2026').closest('dd')).not.toBeNull()
    expect(preview.querySelector('.fui-Avatar')).toHaveAttribute('aria-hidden', 'true')
  })

  it('says when the tasks are synchronised, and when they could not be (WCAG 4.1.3)', async () => {
    const itemContext = renderRiskAction('', PLANNER_TASKS)
    adapter.syncTasks.mockImplementationOnce(() =>
      Promise.reject(httpError('Planner svarte ikke', 503))
    )
    fireEvent.click(screen.getByText(strings.RiskActionFieldValueAdminButtonText))
    fireEvent.click(screen.getByText(strings.NewRiskActionPanelUpdateTaskStatus))
    expect(await screen.findByText(strings.RiskActionSyncFailed)).toBeInTheDocument()
    // Counted once, by the status Planner answered with; the text stays on the page.
    expect(countedTelemetry().errors).toEqual({ 'RiskActionPlanner server_error 503': 1 })
    // Closed and opened again, the popover starts clean: the failure belonged to that attempt.
    fireEvent.click(screen.getByText(strings.RiskActionFieldValueAdminButtonText))
    await waitFor(() => expect(screen.queryByText(strings.RiskActionSyncFailed)).toBeNull())
    fireEvent.click(screen.getByText(strings.RiskActionFieldValueAdminButtonText))
    expect(screen.queryByText(strings.RiskActionSyncFailed)).toBeNull()
    adapter.syncTasks.mockImplementationOnce(() => Promise.resolve({ ...itemContext }))
    fireEvent.click(screen.getByText(strings.NewRiskActionPanelUpdateTaskStatus))
    await waitFor(() => expect(announced()).toContain(strings.RiskActionSyncDone))
    expect(countedTelemetry().errors).toEqual({ 'RiskActionPlanner server_error 503': 1 })
  })

  it('says when an action is added, and shows why when it is not (WCAG 3.3.1, 4.1.3)', async () => {
    renderRiskAction('')
    fireEvent.click(screen.getByText('Ingen tiltak ennå'))
    const panel = await openNewActionPanel()
    const title = within(panel).getAllByRole('textbox')[0]
    fireEvent.change(title, { target: { value: 'Første' } })
    fireEvent.click(within(panel).getByRole('switch'))
    adapter.addTask.mockImplementationOnce(() => Promise.reject(httpError('Ingen tilgang', 403)))
    fireEvent.click(button(strings.SaveButtonLabel))
    expect(await within(panel).findByText(strings.NewRiskActionSaveFailed)).toBeInTheDocument()
    expect(within(panel).getByText('Ingen tilgang')).toBeInTheDocument()
    // The save that failed is counted by its status, and no action is counted as added.
    expect(countedTelemetry()).toEqual({
      usage: {},
      errors: { 'RiskActionPlanner permission_denied 403': 1 },
      timings: {}
    })
    fireEvent.click(button(strings.SaveButtonLabel))
    await waitFor(() => expect(announced()).toContain(format(strings.NewRiskActionSaved, 'Første')))
    expect(countedTelemetry()).toEqual({
      usage: { 'RiskActionPlanner riskAction.created': 1 },
      errors: { 'RiskActionPlanner permission_denied 403': 1 },
      timings: {}
    })
  })

  it('starts clean when the panel is opened again after a failed save', async () => {
    renderRiskAction('')
    fireEvent.click(screen.getByText('Ingen tiltak ennå'))
    let panel = await openNewActionPanel()
    fireEvent.change(within(panel).getAllByRole('textbox')[0], { target: { value: 'Første' } })
    adapter.addTask.mockImplementationOnce(() => Promise.reject(new Error('Ingen tilgang')))
    fireEvent.click(button(strings.SaveButtonLabel))
    expect(await within(panel).findByText(strings.NewRiskActionSaveFailed)).toBeInTheDocument()
    // The panel stays mounted while closed: the error must not wait there for the next opening,
    // where its message bar would announce itself again.
    fireEvent.click(button(strings.CancelButtonLabel))
    await waitFor(() =>
      expect(screen.queryByText(format(strings.NewRiskActionPanelTitle, RISK))).toBeNull()
    )
    fireEvent.click(screen.getByText('Ingen tiltak ennå'))
    panel = await openNewActionPanel()
    expect(within(panel).queryByText(strings.NewRiskActionSaveFailed)).toBeNull()
  })

  it('keeps the focus and names the progress while the actions are migrated, and says when they are (WCAG 2.4.3, 4.1.2, 4.1.3)', async () => {
    let finish: (result: any) => void
    adapter.addTasks.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)))
    renderRiskAction('Ring leverandøren')
    fireEvent.click(screen.getByText('Ring leverandøren'))
    fireEvent.click(screen.getByText(strings.NewRiskActionPanelMigrateRiskActions))
    const create = await screen.findByText(
      format(strings.MigrateRiskActionsDialogCreatePlannerTasks, 1)
    )
    const createButton = create.closest('button')
    createButton.focus()
    fireEvent.click(createButton)
    expect(createButton).toBeInTheDocument()
    expect(createButton).toHaveAttribute('aria-disabled', 'true')
    expect(createButton).toHaveFocus()
    // Named by the text under it, once: as the field's message it was its description as well.
    expect(
      screen.getByRole('progressbar', { name: strings.MigrateRiskActionsDialogProgressText })
    ).not.toHaveAccessibleDescription()
    await act(async () =>
      finish({
        added: [{ id: 'new-0', title: 'Ring leverandøren', isCompleted: '0' }],
        refused: []
      })
    )
    await waitFor(() => expect(announced()).toContain(format(strings.MigrateRiskActionsDone, 1)))
  })

  it('migrates the actions Planner takes, keeps the one it refuses written on the risk, and says which and why', async () => {
    const added = [
      { id: 'new-0', title: 'Ring leverandøren', isCompleted: '0' },
      { id: 'new-2', title: 'Følg opp kontrakten', isCompleted: '0' }
    ]
    adapter.addTasks.mockImplementationOnce(() =>
      Promise.resolve({
        added,
        refused: [{ title: 'Avtal en reserve', reason: 'Du har ikke tilgang til planen.' }]
      })
    )
    const itemContext = renderRiskAction('Ring leverandøren\nAvtal en reserve\nFølg opp kontrakten')
    fireEvent.click(screen.getByText(/Avtal en reserve/))
    fireEvent.click(screen.getByText(strings.NewRiskActionPanelMigrateRiskActions))
    fireEvent.click(
      await screen.findByText(format(strings.MigrateRiskActionsDialogCreatePlannerTasks, 3))
    )
    expect(
      await screen.findByText(format(strings.MigrateRiskActionsPartlyDone, 2, 3))
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        format(
          strings.MigrateRiskActionsRefusedAction,
          'Avtal en reserve',
          'Du har ikke tilgang til planen.'
        )
      )
    ).toBeInTheDocument()
    expect(adapter.updateItem).toHaveBeenCalledWith(added, itemContext, ['Avtal en reserve'])
    // Only the way out is left, and has the focus: migrating the field again would add the two
    // tasks a second time.
    expect(
      screen.queryByText(format(strings.MigrateRiskActionsDialogCreatePlannerTasks, 3))
    ).toBeNull()
    await waitFor(() =>
      expect(
        screen.getByText(strings.MigrateRiskActionsDialogCancel).closest('button')
      ).toHaveFocus()
    )
    // Under the two tasks, the action Planner refused, as it is written on the risk.
    fireEvent.click(screen.getByText(strings.MigrateRiskActionsDialogCancel))
    await waitFor(() =>
      expect(screen.queryByText(format(strings.MigrateRiskActionsDialogTitle, RISK))).toBeNull()
    )
    // The title goes before Fluent lifts aria-hidden from the field, so a slow runner found no list
    // (main's release build, run 43036264643): wait until it is accessible again.
    const list = await screen.findByRole('list', { name: strings.RiskActionTasksLabel })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Avtal en reserve')).toBeInTheDocument()
  })

  it('writes nothing to the risk when Planner refuses all its actions, says why, and lets them be migrated again', async () => {
    adapter.addTasks.mockImplementationOnce(() =>
      Promise.resolve({
        added: [],
        refused: [{ title: 'Ring leverandøren', reason: 'Planen finnes ikke.' }]
      })
    )
    renderRiskAction('Ring leverandøren')
    fireEvent.click(screen.getByText('Ring leverandøren'))
    fireEvent.click(screen.getByText(strings.NewRiskActionPanelMigrateRiskActions))
    fireEvent.click(
      await screen.findByText(format(strings.MigrateRiskActionsDialogCreatePlannerTasks, 1))
    )
    expect(await screen.findByText(strings.MigrateRiskActionsFailed)).toBeInTheDocument()
    expect(
      screen.getByText(
        format(strings.MigrateRiskActionsRefusedAction, 'Ring leverandøren', 'Planen finnes ikke.')
      )
    ).toBeInTheDocument()
    expect(adapter.updateItem).not.toHaveBeenCalled()
    expect(
      screen
        .getByText(format(strings.MigrateRiskActionsDialogCreatePlannerTasks, 1))
        .closest('button')
    ).toBeEnabled()
  })

  it('shows what is written in the field besides the Planner tasks under them', () => {
    renderRiskAction('Ring leverandøren\nAvtal en reserve', [PLANNER_TASKS[0]])
    const list = screen.getByRole('list', { name: strings.RiskActionTasksLabel })
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Avtal en reserve')).toBeInTheDocument()
  })

  it('adds a new action to Planner with its title, days and responsible, and closes', async () => {
    adapter.clientPeoplePickerSearchUser.mockImplementation((query: string) =>
      Promise.resolve(query ? [{ text: 'Kari Nordmann', secondaryText: 'kari@contoso.no' }] : [])
    )
    const itemContext = renderRiskAction('')
    fireEvent.click(screen.getByText('Ingen tiltak ennå'))
    const panel = await openNewActionPanel()
    expect(
      within(panel).getByText(format(strings.NewRiskActionPanelTitle, RISK))
    ).toBeInTheDocument()
    // Focusable while it waits for the title, and says so: it was disabled, skipped by Tab and
    // silent (WCAG 2.1.1, 3.3.2).
    expect(button(strings.SaveButtonLabel)).toHaveAttribute('aria-disabled', 'true')
    expect(button(strings.SaveButtonLabel)).not.toHaveAttribute('disabled')
    expect(button(strings.SaveButtonLabel)).toHaveAccessibleDescription(
      strings.NewRiskActionSaveNeedsTitle
    )
    fireEvent.change(within(panel).getAllByRole('textbox')[0], {
      target: { value: 'Avtal en reserveleverandør' }
    })
    expect(button(strings.SaveButtonLabel)).not.toHaveAttribute('aria-disabled')
    // The days as the picker writes them in the UI language, Norwegian.
    fireEvent.change(within(panel).getByLabelText(strings.StartDateLabel), {
      target: { value: '15.03.2026' }
    })
    fireEvent.change(within(panel).getByLabelText(strings.DueDateLabel), {
      target: { value: '20.03.2026' }
    })
    const user = await searchResponsible(panel, 'Kari')
    await user.click(await screen.findByRole('option', { name: /Kari Nordmann/ }))
    fireEvent.click(button(strings.SaveButtonLabel))
    await waitFor(() => expect(adapter.updateItem).toHaveBeenCalled())
    const [model, context] = adapter.addTask.mock.calls[0] as any[]
    expect(model.get('title')).toBe('Avtal en reserveleverandør')
    expect(model.get('startDate')).toEqual(new Date(2026, 2, 15))
    expect(model.get('dueDate')).toEqual(new Date(2026, 2, 20))
    expect(model.get('responsible')).toBe('kari@contoso.no')
    expect(context).toEqual(itemContext)
    expect(await screen.findByText('Ny oppgave')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText(format(strings.NewRiskActionPanelTitle, RISK))).toBeNull()
    )
    expect(countedTelemetry()).toEqual({
      usage: { 'RiskActionPlanner riskAction.created': 1 },
      errors: {},
      timings: {}
    })
  })

  it('says, as the shared people picker does, when no one matches the responsible typed', async () => {
    renderRiskAction('')
    fireEvent.click(screen.getByText('Ingen tiltak ennå'))
    const panel = await openNewActionPanel()
    await searchResponsible(panel, 'Ukjent')
    expect(await screen.findByText(NO_PEOPLE_FOUND)).toBeInTheDocument()
  })

  it('keeps the panel open to add one action after another, cleared for the next', async () => {
    renderRiskAction('')
    fireEvent.click(screen.getByText('Ingen tiltak ennå'))
    const panel = await openNewActionPanel()
    const title = within(panel).getAllByRole('textbox')[0]
    fireEvent.change(title, { target: { value: 'Første' } })
    fireEvent.click(within(panel).getByRole('switch'))
    fireEvent.click(button(strings.SaveButtonLabel))
    await waitFor(() => expect(adapter.updateItem).toHaveBeenCalled())
    expect(screen.getByText(format(strings.NewRiskActionPanelTitle, RISK))).toBeInTheDocument()
    await waitFor(() => expect(title).toHaveValue(''))
    expect(within(panel).getByRole('switch')).toBeChecked()
  })

  it('turns the actions in the field into Planner tasks, split as the user says', async () => {
    const itemContext = renderRiskAction('Ring leverandøren, Avtal en reserve')
    fireEvent.click(screen.getByText('Ring leverandøren, Avtal en reserve'))
    fireEvent.click(screen.getByText(strings.NewRiskActionPanelMigrateRiskActions))
    expect(
      await screen.findByText(format(strings.MigrateRiskActionsDialogTitle, RISK))
    ).toBeInTheDocument()
    // By line break the field holds one action; by comma it holds two.
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    fireEvent.change(screen.getByLabelText('Skilletegn'), {
      target: { value: strings.MigrateRiskActionsDialogSeparatorOptionComma }
    })
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Ring leverandøren',
      'Avtal en reserve'
    ])
    fireEvent.click(screen.getByText(format(strings.MigrateRiskActionsDialogCreatePlannerTasks, 2)))
    await waitFor(() => expect(adapter.updateItem).toHaveBeenCalled())
    expect(adapter.addTasks).toHaveBeenCalledWith(
      ['Ring leverandøren', 'Avtal en reserve'],
      itemContext
    )
    // Planner took every action: nothing is kept besides the tasks.
    expect(adapter.updateItem.mock.calls[0][2]).toEqual([])
    await waitFor(() =>
      expect(screen.queryByText(format(strings.MigrateRiskActionsDialogTitle, RISK))).toBeNull()
    )
    // Actions that were there already are moved, not added: no new action is counted.
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })
  })

  it('says in the dialog when the migration fails, with a reason or without, leaves the risk as it was, and counts each failure by its code', async () => {
    adapter.addTasks
      .mockImplementationOnce(() => Promise.reject(httpError('Planner svarte ikke', 504)))
      // Without a reason, as a request that was cut off may fail.
      .mockImplementationOnce(() => Promise.reject(undefined))
    renderRiskAction('Ring leverandøren')
    fireEvent.click(screen.getByText('Ring leverandøren'))
    fireEvent.click(screen.getByText(strings.NewRiskActionPanelMigrateRiskActions))
    const create = await screen.findByText(
      format(strings.MigrateRiskActionsDialogCreatePlannerTasks, 1)
    )
    fireEvent.click(create)
    expect(await screen.findByText(strings.MigrateRiskActionsFailed)).toBeInTheDocument()
    expect(screen.getByText('Planner svarte ikke')).toBeInTheDocument()
    // Tried again, the dialog starts clean, and says that it failed though it has no reason to give.
    fireEvent.click(create)
    await waitFor(() => expect(screen.queryByText('Planner svarte ikke')).toBeNull())
    expect(await screen.findByText(strings.MigrateRiskActionsFailed)).toBeInTheDocument()
    expect(adapter.addTasks).toHaveBeenCalledTimes(2)
    expect(adapter.updateItem).not.toHaveBeenCalled()
    expect(countedTelemetry()).toEqual({
      usage: {},
      errors: { 'RiskActionPlanner server_error 504': 1, 'RiskActionPlanner unknown': 1 },
      timings: {}
    })
  })

  it("names the migrate dialog's close button for screen readers, as the other dialogs do", async () => {
    renderRiskAction('Ring leverandøren')
    fireEvent.click(screen.getByText('Ring leverandøren'))
    fireEvent.click(screen.getByText(strings.NewRiskActionPanelMigrateRiskActions))
    await screen.findByText(format(strings.MigrateRiskActionsDialogTitle, RISK))
    expect(screen.getByLabelText(strings.CloseModalText).closest('button')).toBeEnabled()
  })

  it("renders the new-action panel under the drawer's provider alone", async () => {
    renderRiskAction('')
    fireEvent.click(screen.getByText('Ingen tiltak ennå'))
    const panel = await openNewActionPanel()
    // BasePanel supplies the theme; a provider inside it injects the whole theme once more.
    expect(panel.querySelectorAll('.fui-FluentProvider')).toHaveLength(0)
  })
})
