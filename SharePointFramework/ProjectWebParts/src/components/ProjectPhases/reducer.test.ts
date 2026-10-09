import strings from 'ProjectWebPartsStrings'
import reducer, {
  CHANGE_PHASE,
  CHANGE_PHASE_ERROR,
  CHECKLIST_ITEM_SAVED,
  DISMISS_CHANGE_PHASE_DIALOG,
  DISMISS_POPOVER,
  INIT_CHANGE_PHASE,
  INIT_DATA,
  OPEN_POPOVER,
  SET_PHASE,
  initialState
} from './reducer'
import { IProjectPhasesState } from './types'
import { checklistItem, phase } from './testFixtures'

/**
 * The phase selector's state: the phases and the current one, the popover a phase opens, the
 * phase waiting for confirmation in the change-phase dialog, whether a change is running, and the
 * error shown when loading or changing fails. The popover's "change phase" hands its phase to the
 * dialog; the change itself moves the current phase.
 */
const concept = phase('p1', 'Konsept')
const planning = phase('p2', 'Planlegge')
const data = { phases: [concept, planning], currentPhase: concept }

const loaded = (): IProjectPhasesState => reducer(initialState, INIT_DATA({ data }))

describe('ProjectPhases reducer', () => {
  it('starts with nothing loaded and no phases', () => {
    expect(initialState.isDataLoaded).toBe(false)
    expect(initialState.data).toEqual({ phases: [] })
  })

  it('takes the fetched phases, opens on the current phase and ends loading', () => {
    const state = loaded()
    expect(state.isDataLoaded).toBe(true)
    expect(state.data).toBe(data)
    expect(state.phase).toBe(concept)
    expect(state.error).toBeUndefined()
  })

  it('a failed fetch shows its error, keeps the empty data and leaves loading unfinished', () => {
    const state = reducer(
      initialState,
      INIT_DATA({ data: null, error: new Error('Termlageret svarte ikke') })
    )
    // A `CustomError` with severity "error"; compiled to ES5, it is a plain `Error` at runtime.
    expect(state.error).toBeInstanceOf(Error)
    expect(state.error.message).toBe('Termlageret svarte ikke')
    expect(state.error.type).toBe('error')
    expect(state.isDataLoaded).toBe(false)
    expect(state.data).toEqual({ phases: [] })
    expect(state.phase).toBeUndefined()
  })

  it('opens the popover of a phase, and dismissing it closes it', () => {
    const open = reducer(loaded(), OPEN_POPOVER({ phase: planning }))
    expect(open.popover.phase).toBe(planning)
    expect(reducer(open, DISMISS_POPOVER()).popover).toBeNull()
  })

  it('"change phase" in the popover hands its phase to the dialog and closes the popover', () => {
    const state = reducer(reducer(loaded(), OPEN_POPOVER({ phase: planning })), CHANGE_PHASE())
    expect(state.confirmPhase).toBe(planning)
    expect(state.popover).toBeNull()
    // Nothing changes before the user confirms.
    expect(state.phase).toBe(concept)
  })

  it('"change phase" without an open popover throws', () => {
    // Today's behaviour, pinned: the handler reads the phase from the popover unguarded.
    expect(() => reducer(loaded(), CHANGE_PHASE())).toThrow(/reading 'phase'/)
  })

  it('dismissing the dialog forgets the phase waiting for confirmation', () => {
    const confirming = reducer(reducer(loaded(), OPEN_POPOVER({ phase: planning })), CHANGE_PHASE())
    const state = reducer(confirming, DISMISS_CHANGE_PHASE_DIALOG())
    expect(state.confirmPhase).toBeNull()
    expect(state.phase).toBe(concept)
  })

  it('a confirmed change runs, then moves the current phase and ends the run', () => {
    const confirming = reducer(reducer(loaded(), OPEN_POPOVER({ phase: planning })), CHANGE_PHASE())
    const running = reducer(confirming, INIT_CHANGE_PHASE())
    expect(running.isChangingPhase).toBe(true)
    const state = reducer(running, SET_PHASE({ phase: planning }))
    expect(state.phase).toBe(planning)
    expect(state.isChangingPhase).toBe(false)
    // The phase stays in the dialog and the loaded data keeps the old current phase: the page
    // reloads after the change when properties are synced.
    expect(state.confirmPhase).toBe(planning)
    expect(state.data.currentPhase).toBe(concept)
  })

  it('a failed change ends the run and shows the error, keeping the current phase', () => {
    const running = reducer(loaded(), INIT_CHANGE_PHASE())
    const state = reducer(
      running,
      CHANGE_PHASE_ERROR({ error: new Error('Fasen kunne ikke endres') })
    )
    expect(state.isChangingPhase).toBe(false)
    expect(state.error).toBeInstanceOf(Error)
    expect(state.error.message).toBe('Fasen kunne ikke endres')
    expect(state.error.type).toBe('error')
    expect(state.phase).toBe(concept)
    expect(reducer(running, CHANGE_PHASE_ERROR({ error: null })).error).toBeNull()
  })

  it('a saved checkpoint replaces its old version in its phase, counted again, current phase included', () => {
    const open = checklistItem(1, 'Mandat godkjent')
    const done = checklistItem(2, 'Plan laget', strings.StatusClosed)
    const withChecklist = phase('p1', 'Konsept', {}, [open, done])
    const state = reducer(
      initialState,
      INIT_DATA({ data: { phases: [withChecklist, planning], currentPhase: withChecklist } })
    )
    // `update` takes the list's field names, though it is typed with the model's.
    const answered = open.update({
      GtChecklistStatus: strings.StatusClosed,
      GtComment: 'Ok'
    } as any)
    const saved = reducer(state, CHECKLIST_ITEM_SAVED({ item: answered }))
    const savedPhase = saved.data.phases[0]
    expect(savedPhase.checklistData.items).toEqual([answered, done])
    expect(savedPhase.checklistData.stats).toEqual({ [strings.StatusClosed]: 2 })
    expect(savedPhase.name).toBe('Konsept')
    // The current phase is the same phase, so the dialog opened next reads the saved checkpoint.
    expect(saved.phase).toBe(savedPhase)
    expect(saved.data.currentPhase).toBe(savedPhase)
    // A copy: the loaded phase is left as it was, and a phase without the checkpoint is kept.
    expect(withChecklist.checklistData.items).toEqual([open, done])
    expect(saved.data.phases[1]).toBe(planning)
  })
})
