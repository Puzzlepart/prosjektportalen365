import strings from 'ProjectWebPartsStrings'
import { CHECKLIST_ITEM_UPDATED, INIT, SET_VIEW } from './reducer'
import { getNextIndex } from './getNextIndex'
import { View } from './Views'
import { checklistItem, phase } from '../testFixtures'

// The reducer is created inside its hook; the same builder is reached through the hook's module.
import * as reducerModule from './reducer'
import { renderHook } from './testHooks'

/**
 * Where the change-phase dialog starts and how it moves on: through the open checkpoints one at a
 * time, to the summary, and to the confirmation (or the archive step) when there is nothing to
 * check.
 */
const open = (id: number, title: string) => checklistItem(id, title)
const closed = (id: number, title: string) =>
  checklistItem(id, title, strings.StatusClosed, 'Ferdig')

describe('getNextIndex', () => {
  it('finds the next open checkpoint from a start index', () => {
    const items = [closed(1, 'A'), open(2, 'B'), closed(3, 'C'), open(4, 'D')]
    expect(getNextIndex(items)).toBe(1)
    expect(getNextIndex(items, 2)).toBe(3)
    expect(getNextIndex(items, 4)).toBe(-1)
  })
})

describe('ChangePhaseDialog reducer', () => {
  const context = (currentPhase: any, useArchive = false) =>
    ({
      state: { phase: currentPhase, data: { phases: [currentPhase] } },
      props: { useArchive }
    }) as any

  it('starts at the first open checkpoint of the current phase', () => {
    const current = phase('p1', 'Planlegge', {}, [closed(1, 'A'), open(2, 'B')])
    const { state } = renderHook(
      reducerModule.useChangePhaseDialogReducer,
      INIT({ context: context(current) })
    )
    expect(state.view).toBe(View.Initial)
    expect(state.currentIdx).toBe(1)
    expect(state.checklistItems).toHaveLength(2)
    expect(state.isChecklistMandatory).toBe(false)
  })

  it('starts at the summary when every checkpoint is done, and marks a mandatory checklist', () => {
    const current = phase('p1', 'Planlegge', { ChecklistMandatory: 'true' }, [closed(1, 'A')])
    const { state } = renderHook(
      reducerModule.useChangePhaseDialogReducer,
      INIT({ context: context(current) })
    )
    expect(state.view).toBe(View.Summary)
    expect(state.isChecklistMandatory).toBe(true)
  })

  it('starts at the confirmation without a checklist, or at the archive step when archiving is on', () => {
    const current = phase('p1', 'Konsept')
    expect(
      renderHook(reducerModule.useChangePhaseDialogReducer, INIT({ context: context(current) }))
        .state.view
    ).toBe(View.Confirm)
    expect(
      renderHook(
        reducerModule.useChangePhaseDialogReducer,
        INIT({ context: context(current, true) })
      ).state.view
    ).toBe(View.Archive)
  })

  it('moves to the next open checkpoint after an update, and to the summary after the last', () => {
    const current = phase('p1', 'Planlegge', {}, [open(1, 'A'), open(2, 'B')])
    const first = renderHook(
      reducerModule.useChangePhaseDialogReducer,
      INIT({ context: context(current) })
    )
    const second = first.dispatch(
      CHECKLIST_ITEM_UPDATED({
        properties: { GtChecklistStatus: strings.StatusClosed, GtComment: 'Ok' }
      })
    )
    expect(second.view).toBe(View.Initial)
    expect(second.currentIdx).toBe(1)
    expect(second.checklistItems[0].status).toBe(strings.StatusClosed)
    expect(second.checklistItems[0].comment).toBe('Ok')
    const third = first.dispatch(
      CHECKLIST_ITEM_UPDATED({
        properties: { GtChecklistStatus: strings.StatusNotRelevant, GtComment: 'Nei' }
      })
    )
    expect(third.view).toBe(View.Summary)
  })

  it('switches view on request', () => {
    const current = phase('p1', 'Konsept')
    const hook = renderHook(
      reducerModule.useChangePhaseDialogReducer,
      INIT({ context: context(current) })
    )
    expect(hook.dispatch(SET_VIEW({ view: View.ChangingPhase })).view).toBe(View.ChangingPhase)
  })
})
