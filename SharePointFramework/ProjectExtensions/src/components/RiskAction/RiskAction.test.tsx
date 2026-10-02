// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Stand-ins keep Fluent's contracts where jsdom cannot run the
// real controls (see the testing guide): the popovers toggle through `onOpenChange` and show their
// surface while open; the responsible picker (`Combobox`) is a text box for the search and a native
// select for the pick; the separator (`Dropdown`) is a native select. A choice calls
// `onOptionSelect` with the option's value and text.
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const PopoverContext = React.createContext({ open: false, toggle: (_event: any) => undefined })
  const Popover = ({ open: controlled, onOpenChange, children }: any) => {
    const [uncontrolled, setUncontrolled] = React.useState(false)
    const open = controlled ?? uncontrolled
    const toggle = (event: any) => {
      setUncontrolled(!open)
      onOpenChange?.(event, { open: !open })
    }
    return React.createElement(PopoverContext.Provider, { value: { open, toggle } }, children)
  }
  const PopoverTrigger = ({ children }: any) =>
    React.createElement('span', { onClick: React.useContext(PopoverContext).toggle }, children)
  const PopoverSurface = ({ children }: any) =>
    React.useContext(PopoverContext).open ? React.createElement('div', null, children) : null
  const pick = (onOptionSelect: any) => (event: any) => {
    const option = event.target.options[event.target.selectedIndex]
    onOptionSelect?.(event, { optionValue: option.value, optionText: option.textContent })
  }
  const Combobox = ({ value, onChange, onOptionSelect, children }: any) =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement('input', { 'aria-label': 'Søk etter ansvarlig', value, onChange }),
      React.createElement(
        'select',
        { 'aria-label': 'Velg ansvarlig', value: '', onChange: pick(onOptionSelect) },
        React.createElement('option', { value: '' }),
        children
      )
    )
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
  const Option = ({ value, text, children }: any) =>
    React.createElement('option', { value: value ?? '' }, text || children)
  return {
    __esModule: true,
    ...actual,
    Popover,
    PopoverTrigger,
    PopoverSurface,
    Combobox,
    Dropdown,
    Option
  }
})

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { RiskActionFieldCustomizerContext } from '../../extensions/riskAction/context'
import { RiskAction } from './RiskAction'

const RISK = 'Leverandøren går konkurs'
const PLANNER_TASKS = [
  { id: 'task-1', title: 'Ring leverandøren', isCompleted: '0' },
  { id: 'task-2', title: 'Avtal en reserve', isCompleted: '1' }
]

const adapter = {
  globalSettings: new Map<string, string>(),
  getTask: jest.fn(),
  syncTasks: jest.fn(),
  addTask: jest.fn(() => Promise.resolve({ id: 'task-9', title: 'Ny oppgave', isCompleted: '0' })),
  addTasks: jest.fn((titles: string[]) =>
    Promise.resolve(titles.map((title, index) => ({ id: `new-${index}`, title, isCompleted: '0' })))
  ),
  updateItem: jest.fn((tasks: any[], itemContext: any) =>
    Promise.resolve({
      ...itemContext,
      hiddenFieldValues: { data: 'oppdatert', tasks, updated: '2026-10-02T10:00:00Z' }
    })
  ),
  clientPeoplePickerSearchUser: jest.fn((_query: string, _selected: any[]) =>
    Promise.resolve([] as any[])
  )
}

/** The risk action cell of the risk with `fieldValue` and, when it uses Planner, its tasks. */
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
      ? { data: 'tasks', tasks: plannerTasks, updated: '2026-10-01T10:00:00Z' }
      : undefined
  }
  render(
    <RiskActionFieldCustomizerContext.Provider
      value={{ dataAdapter: adapter as any, itemContext: itemContext as any }}
    >
      <RiskAction />
    </RiskActionFieldCustomizerContext.Provider>
  )
  return itemContext
}

const button = (text: string) => screen.getByText(text).closest('button')

let open: jest.SpyInstance

beforeEach(() => {
  open = jest.spyOn(window, 'open').mockImplementation(() => null)
  jest.clearAllMocks()
  adapter.clientPeoplePickerSearchUser.mockImplementation(() => Promise.resolve([]))
})

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  open.mockRestore()
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
    expect(
      screen.getByText(
        format(
          strings.RiskActionPopoverLastUpdated,
          new Date('2026-10-01T10:00:00Z').toLocaleString()
        )
      )
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
        startDateTime: null,
        dueDateTime: null,
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
    fireEvent.click(screen.getByText(strings.RiskActionPlannerTaskPreviewPlannerLinkText))
    expect(open).toHaveBeenCalledWith(
      'https://planner.cloud.microsoft/webui/plan/plan-1/task/task-1',
      '_blank'
    )
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
    fireEvent.click(screen.getByText(strings.RiskActionPlannerTaskPreviewPlannerLinkText))
    expect(open).toHaveBeenCalledWith('https://tasks.office.com/home/task/task-2', '_blank')
  })

  it('adds a new action to Planner with its title and responsible, and closes', async () => {
    adapter.clientPeoplePickerSearchUser.mockImplementation((query: string) =>
      Promise.resolve(query ? [{ text: 'Kari Nordmann', secondaryText: 'kari@contoso.no' }] : [])
    )
    const itemContext = renderRiskAction('')
    fireEvent.click(screen.getByText('Ingen tiltak ennå'))
    fireEvent.click(screen.getByText(strings.NewRiskActionPanelAddNewRiskAction))
    const panel = await screen.findByRole('dialog')
    expect(
      within(panel).getByText(format(strings.NewRiskActionPanelTitle, RISK))
    ).toBeInTheDocument()
    expect(button(strings.SaveButtonLabel)).toBeDisabled()
    fireEvent.change(within(panel).getAllByRole('textbox')[0], {
      target: { value: 'Avtal en reserveleverandør' }
    })
    fireEvent.change(screen.getByLabelText('Søk etter ansvarlig'), { target: { value: 'Kari' } })
    await screen.findByRole('option', { name: 'Kari Nordmann' })
    fireEvent.change(screen.getByLabelText('Velg ansvarlig'), {
      target: { value: 'kari@contoso.no' }
    })
    fireEvent.click(button(strings.SaveButtonLabel))
    await waitFor(() => expect(adapter.updateItem).toHaveBeenCalled())
    const [model, context] = adapter.addTask.mock.calls[0] as any[]
    expect(model.get('title')).toBe('Avtal en reserveleverandør')
    expect(model.get('responsible')).toBe('kari@contoso.no')
    expect(context).toEqual(itemContext)
    expect(await screen.findByText('Ny oppgave')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText(format(strings.NewRiskActionPanelTitle, RISK))).toBeNull()
    )
  })

  it('says when no user matches the search for a responsible', async () => {
    renderRiskAction('')
    fireEvent.click(screen.getByText('Ingen tiltak ennå'))
    fireEvent.click(screen.getByText(strings.NewRiskActionPanelAddNewRiskAction))
    await screen.findByRole('dialog')
    fireEvent.change(screen.getByLabelText('Søk etter ansvarlig'), { target: { value: 'Ukjent' } })
    expect(
      await screen.findByText(format(strings.ResponsibleFieldNoResults, 'Ukjent'))
    ).toBeInTheDocument()
  })

  it('keeps the panel open to add one action after another', async () => {
    renderRiskAction('')
    fireEvent.click(screen.getByText('Ingen tiltak ennå'))
    fireEvent.click(screen.getByText(strings.NewRiskActionPanelAddNewRiskAction))
    const panel = await screen.findByRole('dialog')
    fireEvent.change(within(panel).getAllByRole('textbox')[0], { target: { value: 'Første' } })
    fireEvent.click(within(panel).getByRole('switch'))
    fireEvent.click(button(strings.SaveButtonLabel))
    await waitFor(() => expect(adapter.updateItem).toHaveBeenCalled())
    expect(screen.getByText(format(strings.NewRiskActionPanelTitle, RISK))).toBeInTheDocument()
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
    await waitFor(() =>
      expect(screen.queryByText(format(strings.MigrateRiskActionsDialogTitle, RISK))).toBeNull()
    )
  })
})
