import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
import { PortfolioOverviewView, ProjectColumn, format } from 'pp365-shared-library'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import { useEditViewColumnsPanel as useAggregationPanelProps } from '../PortfolioAggregation/useEditViewColumnsPanel'
import { useEditViewColumnsPanel as useOverviewPanelProps } from '../PortfolioOverview/hooks/useEditViewColumnsPanel'
import { EDIT_VIEW_COLUMNS_PANEL_DEFAULT_PROPS, EditViewColumnsPanel } from './EditViewColumnsPanel'
import { EditViewColumnsPanelSortMode } from './types'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'
import { announced } from 'pp365-jest-config/lib/announce'

/**
 * Create a column fixture with selection state and optional display metadata.
 */
const column = (
  id: number,
  fieldName: string,
  name: string,
  isSelected: boolean,
  data: Record<string, any> = {}
) =>
  ({
    key: fieldName,
    fieldName,
    name,
    minWidth: 100,
    id,
    sortOrder: id * 10,
    data: { isSelected, ...data }
  }) as any

const columns = () => [
  column(3, 'GtBudgetTotal', 'Budsjett', false),
  column(2, 'GtProjectPhase', 'Fase', true),
  column(1, 'Title', 'Tittel', true, { isLocked: true })
]

function renderPanel(props: Record<string, any> = {}) {
  const onSave = jest.fn()
  render(
    <AriaLiveAnnouncer>
      <TelemetryProvider component='PortfolioOverviewWebPart'>
        <EditViewColumnsPanel
          open
          onClose={jest.fn()}
          onSave={onSave}
          sortMode={EditViewColumnsPanelSortMode.CustomSelectedOnTop}
          columns={columns()}
          {...props}
        />
      </TelemetryProvider>
    </AriaLiveAnnouncer>
  )
  return onSave
}

/** What a list answers a user it does not let change it. */
const refusal = () => Object.assign(new Error('Ingen tilgang'), { status: 403 })

/**
 * The panel as an overview gives it its props, in the web part the overview is in.
 *
 * @param usePanelProps The overview's hook for the panel's props, on the test's context
 * @param alias The alias of the web part
 */
function renderOwnedPanel(usePanelProps: () => any, alias: string) {
  /** The panel with the props its owner's hook makes on every render. */
  const OwnedPanel: React.FC = () => <EditViewColumnsPanel {...usePanelProps()} />
  render(
    <AriaLiveAnnouncer>
      <TelemetryProvider component={alias}>
        <OwnedPanel />
      </TelemetryProvider>
    </AriaLiveAnnouncer>
  )
}

/** «Bruk», which saves the view with the columns chosen. */
const applyButton = () => screen.getByRole('button', { name: strings.UseChangesButtonText })

beforeEach(() => startTestTelemetry())

/**
 * One chosen column above three that are not, in sort order: a column chosen in the panel keeps its
 * place below the unchosen ones above it.
 */
const columnsWithUnchosen = () => [
  column(1, 'Title', 'Tittel', true, { isLocked: true }),
  column(2, 'GtBudgetTotal', 'Budsjett', false),
  column(3, 'GtProjectPhase', 'Fase', false),
  column(4, 'GtStartDate', 'Startdato', false)
]

/** The column names in the order the panel lists them. */
const listedNames = () =>
  screen.getAllByText(/^(Tittel|Fase|Budsjett|Startdato)$/).map((label) => label.textContent)
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

/** Renders the panel's hook alone, for what a drag reports: a drag cannot run under jsdom. */
function renderPanelHook(columnList: any[]) {
  const result: { panel?: ReturnType<typeof useEditViewColumnsPanel> } = {}
  // The props are made once: new columns on every render would make the panel select them again.
  const props = {
    ...EDIT_VIEW_COLUMNS_PANEL_DEFAULT_PROPS,
    open: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    sortMode: EditViewColumnsPanelSortMode.CustomSelectedOnTop,
    columns: columnList
  } as any
  /** Capture the panel's drag handlers without requiring jsdom to perform a drag. */
  const Probe: React.FC = () => {
    result.panel = useEditViewColumnsPanel(props)
    return null
  }
  render(<Probe />)
  return result
}

describe('EditViewColumnsPanel', () => {
  it('lists the selected columns first, then the rest; a locked column cannot be unchosen', () => {
    renderPanel()
    expect(listedNames()).toEqual(['Tittel', 'Fase', 'Budsjett'])
    expect(screen.getByRole('checkbox', { name: 'Tittel' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Tittel' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Budsjett' })).not.toBeChecked()
  })

  it("follows the view's own column order for the selected columns", () => {
    renderPanel({ customColumnOrder: [2, 1] })
    expect(listedNames()).toEqual(['Fase', 'Tittel', 'Budsjett'])
  })

  it('hands back the selected columns and their ids on use', async () => {
    const user = setupUser()
    const onSave = renderPanel()
    await user.click(screen.getByRole('button', { name: strings.UseChangesButtonText }))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0].map((c: any) => c.name)).toEqual(['Tittel', 'Fase'])
    expect(onSave.mock.calls[0][1]).toEqual([1, 2])
  })

  it('adds a chosen column to the set and removes an unchosen one', async () => {
    const user = setupUser()
    const onSave = renderPanel()
    await user.click(screen.getByRole('checkbox', { name: 'Budsjett' }))
    await user.click(screen.getByRole('checkbox', { name: 'Fase' }))
    await user.click(screen.getByRole('button', { name: strings.UseChangesButtonText }))
    expect(onSave.mock.calls[0][1]).toEqual([1, 3])
  })

  it('moves a selected column down and up again', async () => {
    const user = setupUser()
    const onSave = renderPanel()
    const move = (direction: string) =>
      screen.getByRole('button', { name: format(direction, 'Tittel') })
    await user.click(move(strings.MoveColumnDown))
    expect(listedNames()).toEqual(['Fase', 'Tittel', 'Budsjett'])
    await user.click(move(strings.MoveColumnUp))
    expect(listedNames()).toEqual(['Tittel', 'Fase', 'Budsjett'])
    await user.click(move(strings.MoveColumnDown))
    await user.click(screen.getByRole('button', { name: strings.UseChangesButtonText }))
    expect(onSave.mock.calls[0][1]).toEqual([2, 1])
  })

  it('moves a column chosen below unchosen ones one step among the chosen columns, the order the view saves', async () => {
    // The buttons moved the row at the column's place among the chosen columns in the whole list:
    // two other rows swapped and the column stayed (1.15 smoke test).
    const user = setupUser()
    const onSave = renderPanel({ columns: columnsWithUnchosen() })
    await user.click(screen.getByRole('checkbox', { name: 'Fase' }))
    await user.click(screen.getByRole('checkbox', { name: 'Startdato' }))
    expect(listedNames()).toEqual(['Tittel', 'Budsjett', 'Fase', 'Startdato'])
    const move = (direction: string, name: string) =>
      screen.getByRole('button', { name: format(direction, name) })
    // Fase is the second of three chosen columns, though third in the list: it can go down.
    expect(move(strings.MoveColumnDown, 'Fase')).not.toHaveAttribute('aria-disabled', 'true')
    expect(move(strings.MoveColumnDown, 'Startdato')).toHaveAttribute('aria-disabled', 'true')
    await user.click(move(strings.MoveColumnUp, 'Startdato'))
    expect(listedNames()).toEqual(['Tittel', 'Budsjett', 'Startdato', 'Fase'])
    await waitFor(() =>
      expect(announced()).toContain(format(strings.ColumnMovedAnnouncement, 'Startdato', 2, 3))
    )
    await user.click(screen.getByRole('button', { name: strings.UseChangesButtonText }))
    expect(onSave.mock.calls[0][1]).toEqual([1, 4, 3])
  })

  it('chooses only the column ticked when another column shows the same managed property', async () => {
    const user = setupUser()
    const onSave = renderPanel({
      columns: [
        column(1, 'Title', 'Tittel', true, { isLocked: true }),
        column(2, 'GtProjectPhase', 'Fase', false),
        column(9, 'GtProjectPhase', 'Fase (kopi)', false)
      ]
    })
    await user.click(screen.getByRole('checkbox', { name: 'Fase (kopi)' }))
    expect(screen.getByRole('checkbox', { name: 'Fase' })).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: strings.UseChangesButtonText }))
    expect(onSave.mock.calls[0][1]).toEqual([1, 9])
  })

  it('hands back a column it chose as the column it was, so a view can still be configured with it', async () => {
    // A spread copy lost the column's methods: saving a view after choosing columns failed in the
    // view's `configure`, which calls `isVisible`.
    const user = setupUser()
    const projectColumn = (Id: number, Title: string, isSelected: boolean) =>
      new ProjectColumn({
        Id,
        Title,
        GtManagedProperty: `Kolonne${Id}`,
        GtSortOrder: Id * 10,
        GtShowFieldPortfolio: true
      }).setData({ isSelected })
    const onSave = renderPanel({
      columns: [projectColumn(1, 'Tittel', true), projectColumn(3, 'Budsjett', false)]
    })
    await user.click(screen.getByRole('checkbox', { name: 'Budsjett' }))
    await user.click(screen.getByRole('button', { name: strings.UseChangesButtonText }))
    const [chosen] = onSave.mock.calls[0]
    expect(chosen.every((c: any) => c instanceof ProjectColumn)).toBe(true)
    const view = new PortfolioOverviewView({
      Id: 1,
      Title: 'Alle prosjekter',
      GtSearchQuery: '',
      GtPortfolioColumnsId: [1, 3]
    })
    expect(view.configure(chosen).columns.map((c) => c.name)).toEqual(['Tittel', 'Budsjett'])
  })

  it('names each move by its column, keeps one that cannot be made focusable with its reason, and tells where a column went (WCAG 2.1.1, 2.4.6, 4.1.3)', async () => {
    const user = setupUser()
    renderPanel()
    const up = screen.getByRole('button', { name: format(strings.MoveColumnUp, 'Tittel') })
    expect(up).toHaveAttribute('aria-disabled', 'true')
    expect(up).toHaveAttribute('title', strings.Aria.MoveUpDisabled)
    await user.click(screen.getByRole('button', { name: format(strings.MoveColumnDown, 'Tittel') }))
    await waitFor(() =>
      expect(announced()).toContain(format(strings.ColumnMovedAnnouncement, 'Tittel', 2, 2))
    )
  })

  it("keeps the focus on the moved column's buttons, the other one where it can move no further (WCAG 2.4.3)", async () => {
    // The row moved in the page as it was drawn again, and the focus went behind the panel.
    renderPanel()
    const move = (direction: string, name = 'Tittel') =>
      screen.getByRole('button', { name: format(direction, name) })
    move(strings.MoveColumnDown).focus()
    fireEvent.click(move(strings.MoveColumnDown))
    // Second of two chosen columns: down can go no further, so up has the focus.
    await waitFor(() => expect(move(strings.MoveColumnUp)).toHaveFocus())
    fireEvent.click(move(strings.MoveColumnUp))
    await waitFor(() => expect(move(strings.MoveColumnDown)).toHaveFocus())
  })

  it('is named by its title, its actions under the heading and not in it (WCAG 1.3.1, 4.1.2)', () => {
    // The heading held the buttons, and named the panel «BrukTilbakestill rekkefølge».
    renderPanel()
    const heading = screen.getByRole('heading', { name: strings.EditViewColumnsPanelHeaderText })
    expect(heading.querySelector('button:not([aria-label])')).toBeNull()
    expect(
      screen.getByRole('dialog', { name: strings.EditViewColumnsPanelHeaderText })
    ).toBeInTheDocument()
    expect(screen.getAllByRole('heading')).toHaveLength(1)
  })

  it('is dragged with the mouse only: a row is no button around its checkbox and move buttons (WCAG 4.1.2)', () => {
    // As the drag handle, the row was a button holding controls, which a screen reader cannot
    // reach inside (axe's nested-interactive, 2026-10-21). The keyboard moves a column with the
    // move buttons, which say where it went.
    renderPanel()
    const row = screen.getByText('Fase').closest('[data-rfd-draggable-id]')
    expect(row).not.toHaveAttribute('role')
    expect(row).not.toHaveAttribute('tabindex')
    expect(row).not.toHaveAttribute('aria-describedby')
  })

  it('tells in Norwegian where a dragged column is as it goes (WCAG 3.1.2, 4.1.3)', () => {
    // The drag-and-drop library's own announcements are English.
    let panel: ReturnType<typeof useEditViewColumnsPanel>
    const props = {
      ...EDIT_VIEW_COLUMNS_PANEL_DEFAULT_PROPS,
      open: true,
      onClose: jest.fn(),
      onSave: jest.fn(),
      sortMode: EditViewColumnsPanelSortMode.CustomSelectedOnTop,
      columns: columns()
    } as any
    /** Capture drag-announcement handlers under React's hook lifecycle. */
    const Probe: React.FC = () => {
      panel = useEditViewColumnsPanel(props)
      return null
    }
    render(<Probe />)
    const announce = jest.fn()
    act(() =>
      panel.onDragStart({ source: { index: 0 }, draggableId: 'Tittel' } as any, { announce })
    )
    expect(announce).toHaveBeenLastCalledWith(format(strings.ColumnLiftedAnnouncement, 'Tittel', 1))
    act(() =>
      panel.onDragUpdate(
        { source: { index: 0 }, destination: { index: 1 }, draggableId: 'Tittel' } as any,
        { announce }
      )
    )
    expect(announce).toHaveBeenLastCalledWith(format(strings.ColumnDragPositionAnnouncement, 2, 2))
    act(() =>
      panel.onDragEnd({ source: { index: 0 }, destination: null, draggableId: 'Tittel' } as any, {
        announce
      })
    )
    expect(announce).toHaveBeenLastCalledWith(
      format(strings.ColumnDropCancelledAnnouncement, 'Tittel', 1)
    )
    act(() =>
      panel.onDragEnd(
        { source: { index: 0 }, destination: { index: 1 }, draggableId: 'Tittel' } as any,
        { announce }
      )
    )
    expect(announce).toHaveBeenLastCalledWith(
      format(strings.ColumnMovedAnnouncement, 'Tittel', 2, 2)
    )
  })

  it('tells the place of a dragged column among the chosen columns, not among all the rows', () => {
    const result = renderPanelHook(columnsWithUnchosen())
    act(() => result.panel.onChange(result.panel.selectableColumns[3], true))
    const announce = jest.fn()
    // Startdato, chosen now, is the second chosen column in the list's last row.
    act(() =>
      result.panel.onDragStart({ source: { index: 3 }, draggableId: 'Startdato' } as any, {
        announce
      })
    )
    expect(announce).toHaveBeenLastCalledWith(
      format(strings.ColumnLiftedAnnouncement, 'Startdato', 2)
    )
    act(() =>
      result.panel.onDragUpdate(
        { source: { index: 0 }, destination: { index: 3 }, draggableId: 'Tittel' } as any,
        { announce }
      )
    )
    expect(announce).toHaveBeenLastCalledWith(format(strings.ColumnDragPositionAnnouncement, 2, 2))
    act(() =>
      result.panel.onDragEnd(
        { source: { index: 0 }, destination: { index: 3 }, draggableId: 'Tittel' } as any,
        { announce }
      )
    )
    expect(announce).toHaveBeenLastCalledWith(
      format(strings.ColumnMovedAnnouncement, 'Tittel', 2, 2)
    )
    expect(result.panel.selectedColumns.map((c) => c.name)).toEqual(['Startdato', 'Tittel'])
  })

  it('drops a dragged column where it lands, and ignores a drop outside the list', () => {
    // A drag cannot be performed under jsdom (every element measures zero), so the drop the
    // drag-and-drop library reports is handed to the panel's handler directly.
    let panel: ReturnType<typeof useEditViewColumnsPanel>
    // The props are made once: new columns on every render would make the panel select them again.
    const props = {
      ...EDIT_VIEW_COLUMNS_PANEL_DEFAULT_PROPS,
      open: true,
      onClose: jest.fn(),
      onSave: jest.fn(),
      sortMode: EditViewColumnsPanelSortMode.CustomSelectedOnTop,
      columns: columns()
    } as any
    /** Capture the drop handler and its resulting column order. */
    const Probe: React.FC = () => {
      panel = useEditViewColumnsPanel(props)
      return null
    }
    render(<Probe />)
    const selectedNames = () => panel.selectedColumns.map((c) => c.name)
    expect(selectedNames()).toEqual(['Tittel', 'Fase'])
    act(() => panel.onDragEnd({ source: { index: 0 }, destination: { index: 1 } } as any, null))
    expect(selectedNames()).toEqual(['Fase', 'Tittel'])
    act(() => panel.onDragEnd({ source: { index: 0 }, destination: null } as any, null))
    expect(selectedNames()).toEqual(['Fase', 'Tittel'])
  })

  it('offers the revert button when the view has a custom order', async () => {
    const user = setupUser()
    const onClick = jest.fn()
    renderPanel({ customColumnOrder: [2, 1], revertOrder: { onClick, disabled: false } })
    await user.click(screen.getByRole('button', { name: strings.RevertCustomOrderButtonText }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0]).toHaveLength(3)
  })

  it('says that the view could not be saved when the save is refused, keeps the columns as chosen, and counts the refusal once (WCAG 3.3.1, 4.1.3)', async () => {
    // The panel did nothing: the refusal went to the button's click, unhandled and uncounted.
    const user = setupUser()
    const onSave = jest.fn().mockRejectedValueOnce(refusal()).mockResolvedValue(undefined)
    renderPanel({ onSave })
    await user.click(screen.getByRole('checkbox', { name: 'Budsjett' }))
    await user.click(applyButton())
    expect(await screen.findByText(strings.ViewSaveErrorText)).toBeInTheDocument()
    expect(screen.getByText(strings.ErrorTitle)).toBeInTheDocument()
    await waitFor(() => expect(announced()).toContain(strings.ViewSaveErrorText))
    expect(screen.getByRole('checkbox', { name: 'Budsjett' })).toBeChecked()
    expect(countedTelemetry()).toEqual({
      usage: {},
      errors: { 'PortfolioOverviewWebPart permission_denied 403': 1 },
      timings: {}
    })

    // A save that is taken clears the message, and counts nothing: no event is a view's columns.
    await user.click(applyButton())
    await waitFor(() => expect(screen.queryByText(strings.ViewSaveErrorText)).toBeNull())
    expect(onSave).toHaveBeenCalledTimes(2)
    expect(onSave.mock.calls[1][1]).toEqual([1, 2, 3])
    expect(countedTelemetry()).toEqual({
      usage: {},
      errors: { 'PortfolioOverviewWebPart permission_denied 403': 1 },
      timings: {}
    })
  })

  it("tells of the portfolio overview's save of a view's columns that its list refuses, and of its order put back", async () => {
    const user = setupUser()
    const projectColumn = (Id: number, Title: string) =>
      new ProjectColumn({
        Id,
        Title,
        GtManagedProperty: `Kolonne${Id}`,
        GtSortOrder: Id * 10,
        GtShowFieldPortfolio: true
      })
    const [title, phase, budget] = [
      projectColumn(1, 'Tittel'),
      projectColumn(2, 'Fase'),
      projectColumn(3, 'Budsjett')
    ]
    const updateItemInList = jest.fn().mockRejectedValueOnce(refusal()).mockResolvedValue(undefined)
    const context = {
      props: {
        configuration: { columns: [title, phase, budget] },
        dataAdapter: { portalDataService: { updateItemInList } }
      },
      state: {
        isEditViewColumnsPanelOpen: true,
        columns: [title, phase],
        currentView: { id: 7, columnOrder: [2, 1] },
        deletedColumnIds: []
      },
      dispatch: jest.fn()
    } as any
    renderOwnedPanel(() => useOverviewPanelProps(context), 'ProgramProjectOverviewWebPart')
    await user.click(applyButton())
    expect(await screen.findByText(strings.ViewSaveErrorText)).toBeInTheDocument()
    expect(updateItemInList).toHaveBeenCalledWith('PORTFOLIO_VIEWS', 7, {
      GtPortfolioColumnsId: [2, 1],
      GtPortfolioColumnOrder: '[2,1]'
    })
    // The view keeps its columns and the panel stays open: nothing reached the overview's state.
    expect(context.dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry().errors).toEqual({
      'ProgramProjectOverviewWebPart permission_denied 403': 1
    })

    // The list takes the next save: the overview gets the columns and closes the panel.
    await user.click(applyButton())
    await waitFor(() => expect(context.dispatch).toHaveBeenCalledTimes(1))
    expect(context.dispatch.mock.calls[0][0].payload).toMatchObject({ isOpen: false })
    expect(context.dispatch.mock.calls[0][0].payload.columns.map((c: any) => c.id)).toEqual([2, 1])
    expect(screen.queryByText(strings.ViewSaveErrorText)).toBeNull()

    // Putting the order back is a save of the view too.
    updateItemInList.mockRejectedValueOnce(Object.assign(new Error('Borte'), { status: 404 }))
    await user.click(screen.getByRole('button', { name: strings.RevertCustomOrderButtonText }))
    expect(await screen.findByText(strings.ViewSaveErrorText)).toBeInTheDocument()
    expect(updateItemInList).toHaveBeenLastCalledWith('PORTFOLIO_VIEWS', 7, {
      GtPortfolioColumnOrder: null
    })
    expect(context.dispatch).toHaveBeenCalledTimes(1)
    expect(countedTelemetry()).toEqual({
      usage: {},
      errors: {
        'ProgramProjectOverviewWebPart permission_denied 403': 1,
        'ProgramProjectOverviewWebPart not_found 404': 1
      },
      timings: {}
    })
  })

  it("tells of the aggregated overview's save of a view's columns that its list refuses", async () => {
    const user = setupUser()
    const updateDataSourceItem = jest
      .fn()
      .mockRejectedValueOnce(refusal())
      .mockResolvedValue(undefined)
    const [title, phase] = [
      column(1, 'Title', 'Tittel', true, { isLocked: true }),
      column(2, 'GtProjectPhase', 'Fase', true)
    ]
    const context = {
      props: { dataAdapter: { portalDataService: { updateDataSourceItem } } },
      state: {
        isEditViewColumnsPanelOpen: true,
        allColumnsForCategory: [title, phase, column(3, 'GtBudgetTotal', 'Budsjett', false)],
        columns: [title, phase],
        currentView: { title: 'Alle leveranser' }
      },
      dispatch: jest.fn()
    } as any
    renderOwnedPanel(() => useAggregationPanelProps(context), 'PortfolioAggregationWebPart')
    await user.click(screen.getByRole('checkbox', { name: 'Budsjett' }))
    await user.click(applyButton())
    expect(await screen.findByText(strings.ViewSaveErrorText)).toBeInTheDocument()
    await waitFor(() => expect(announced()).toContain(strings.ViewSaveErrorText))
    expect(updateDataSourceItem).toHaveBeenCalledWith(
      'DATA_SOURCES',
      { GtProjectContentColumnsId: [1, 2, 3] },
      'Alle leveranser',
      true
    )
    expect(screen.getByRole('checkbox', { name: 'Budsjett' })).toBeChecked()
    expect(context.dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry()).toEqual({
      usage: {},
      errors: { 'PortfolioAggregationWebPart permission_denied 403': 1 },
      timings: {}
    })

    // The list takes the next save: the overview gets the columns and closes the panel.
    await user.click(applyButton())
    await waitFor(() => expect(context.dispatch).toHaveBeenCalled())
    expect(context.dispatch.mock.calls[0][0].payload.columns.map((c: any) => c.id)).toEqual([
      1, 2, 3
    ])
    expect(screen.queryByText(strings.ViewSaveErrorText)).toBeNull()
    expect(countedTelemetry().errors).toEqual({
      'PortfolioAggregationWebPart permission_denied 403': 1
    })
  })
})
