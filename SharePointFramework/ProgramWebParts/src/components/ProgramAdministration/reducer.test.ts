import { IProgramAdministrationState } from './types'
import reducer, {
  ADD_CHILD_PROJECTS,
  REMOVE_CHILD_PROJECTS,
  SET_SELECTED_TO_ADD,
  SET_SELECTED_TO_DELETE,
  TOGGLE_ADD_PROJECT_DIALOG,
  initialState
} from './reducer'

/**
 * The program administration's state: a selection never outlives the rows it named, and the add
 * dialog opens with nothing selected. The grid shows this state, so a stale id here was a "Fjern"
 * button that did nothing.
 */
const project = (SiteId: string) => ({ SiteId, Title: SiteId })

describe('ProgramAdministration reducer', () => {
  it('clears the selection when the selected child projects are removed', () => {
    let state: IProgramAdministrationState = {
      ...initialState,
      childProjects: [project('a'), project('b')]
    }
    state = reducer(state, SET_SELECTED_TO_DELETE(['a']))
    state = reducer(state, REMOVE_CHILD_PROJECTS({ siteIdsToRemove: ['a'] }))
    expect(state.childProjects.map((p) => p.SiteId)).toEqual(['b'])
    expect(state.selectedProjects).toEqual([])
  })

  it('opens the add dialog with nothing selected, and clears the list selection too', () => {
    let state: IProgramAdministrationState = reducer(
      { ...initialState },
      SET_SELECTED_TO_DELETE(['a'])
    )
    state = reducer(state, TOGGLE_ADD_PROJECT_DIALOG())
    expect(state.addProjectDialog.open).toBe(true)
    expect(state.addProjectDialog.selectedProjects).toEqual([])
    expect(state.selectedProjects).toEqual([])
  })

  it('adding child projects closes the dialog and leaves nothing selected', () => {
    let state: IProgramAdministrationState = reducer(
      { ...initialState },
      TOGGLE_ADD_PROJECT_DIALOG()
    )
    state = reducer(state, SET_SELECTED_TO_ADD(['c']))
    state = reducer(state, ADD_CHILD_PROJECTS([project('c')] as any))
    expect(state.childProjects.map((p) => p.SiteId)).toEqual(['c'])
    expect(state.addProjectDialog.open).toBe(false)
    expect(state.addProjectDialog.selectedProjects).toEqual([])
    expect(state.selectedProjects).toEqual([])
  })
})
