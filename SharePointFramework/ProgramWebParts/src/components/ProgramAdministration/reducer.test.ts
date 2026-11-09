import { IProgramAdministrationState } from './types'
import reducer, {
  ADD_CHILD_PROJECTS,
  DATA_LOADED,
  REMOVE_CHILD_PROJECTS,
  SET_IS_DELETING,
  SET_SELECTED_TO_ADD,
  SET_SELECTED_TO_DELETE,
  TOGGLE_ADD_PROJECT_DIALOG,
  initialState
} from './reducer'

/**
 * The program administration's state: a selection never outlives the rows it named, and the add
 * dialog opens with nothing selected. The grid shows this state, so a stale id here was a "Fjern"
 * button that did nothing. Two loads fill it: the page's (child projects and the user's manage
 * permission) and the add dialog's (the projects that can be added), each ending its own
 * loading flag.
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

  it("the page's load lists the child projects keyed by site id, sets the manage permission and ends the page's loading", () => {
    const state = reducer(
      {
        ...initialState,
        availableProjects: [project('x')],
        addProjectDialog: { open: false, loading: true, selectedProjects: [] }
      },
      DATA_LOADED({
        data: { childProjects: [project('a'), project('b')], userHasManagePermission: true },
        scope: 'ProgramAdministration'
      })
    )
    expect(state.childProjects).toEqual([
      { key: 'a', SiteId: 'a', Title: 'a' },
      { key: 'b', SiteId: 'b', Title: 'b' }
    ])
    expect(state.userHasManagePermission).toBe(true)
    expect(state.loading).toBe(false)
    expect(state.availableProjects).toEqual([project('x')])
    expect(state.addProjectDialog.loading).toBe(true)
  })

  it('keeps a key a loaded project already has', () => {
    const state = reducer(
      { ...initialState },
      DATA_LOADED({
        data: { childProjects: [{ ...project('a'), key: 'egen' }] },
        scope: 'ProgramAdministration'
      })
    )
    expect(state.childProjects).toEqual([{ key: 'egen', SiteId: 'a', Title: 'a' }])
  })

  it("the add dialog's load lists the projects that can be added and ends only the dialog's loading", () => {
    const state = reducer(
      {
        ...initialState,
        childProjects: [project('a')],
        userHasManagePermission: true,
        addProjectDialog: { open: true, loading: true, selectedProjects: ['c'] }
      },
      DATA_LOADED({ data: { availableProjects: [project('c')] }, scope: 'AddProjectDialog' })
    )
    expect(state.availableProjects).toEqual([{ key: 'c', SiteId: 'c', Title: 'c' }])
    expect(state.addProjectDialog).toEqual({ open: true, loading: false, selectedProjects: ['c'] })
    expect(state.loading).toBe(true)
    expect(state.childProjects).toEqual([project('a')])
    expect(state.userHasManagePermission).toBe(true)
  })

  it('a load that found nothing empties the list it loaded, while a list it did not load is kept', () => {
    const state = reducer(
      { ...initialState, childProjects: [project('a')], availableProjects: [project('c')] },
      DATA_LOADED({ data: { availableProjects: [] }, scope: 'AddProjectDialog' })
    )
    expect(state.availableProjects).toEqual([])
    expect(state.childProjects).toEqual([project('a')])
  })

  it('a load without the manage permission keeps the one known, and a denied permission replaces it', () => {
    let state = reducer(
      { ...initialState, userHasManagePermission: true },
      DATA_LOADED({ data: {}, scope: 'ProgramAdministration' })
    )
    expect(state.userHasManagePermission).toBe(true)
    state = reducer(
      state,
      DATA_LOADED({ data: { userHasManagePermission: false }, scope: 'ProgramAdministration' })
    )
    expect(state.userHasManagePermission).toBe(false)
  })

  it('marks the list as deleting while projects are removed, and the removal ends it', () => {
    let state: IProgramAdministrationState = {
      ...initialState,
      childProjects: [project('a'), project('b')]
    }
    state = reducer(state, SET_IS_DELETING(true))
    expect(state.isDeleting).toBe(true)
    state = reducer(state, REMOVE_CHILD_PROJECTS({ siteIdsToRemove: ['a'] }))
    expect(state.isDeleting).toBe(false)
    state = reducer(reducer(state, SET_IS_DELETING(true)), SET_IS_DELETING(false))
    expect(state.isDeleting).toBe(false)
  })
})
