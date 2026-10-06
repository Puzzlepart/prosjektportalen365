import { ItemFieldValues, ProjectColumn } from 'pp365-shared-library/lib/models'
import { renderHook } from '../../ProjectPhases/ChangePhaseDialog/testHooks'
import {
  CLOSE_DIALOG,
  CLOSE_PANEL,
  FETCH_DATA_ERROR,
  INIT_DATA,
  OPEN_DIALOG,
  OPEN_PANEL,
  PROPERTIES_UPDATED,
  SET_PROGRESS,
  UPDATE_DATA,
  useProjectInformationReducer
} from '.'

/**
 * The project information web part's state: the data fetched for the project, the properties
 * built from it (in column order, named by their column, with the item's values), the panel or
 * dialog that is open, the progress dialog, and the time of the last property update, which
 * makes the web part fetch its data again. The reducer is created inside its hook, so the tests
 * run the hook.
 */
const spfxContext = { pageContext: { cultureInfo: { currentUICultureName: 'nb-NO' } } } as any

const field = (InternalName: string, Title: string) =>
  ({ Id: InternalName, InternalName, Title, TypeAsString: 'Text' }) as any

const column = (GtInternalName: string, Title: string, GtSortOrder: number) =>
  new ProjectColumn({ GtInternalName, Title, GtSortOrder } as any)

function projectData(values: Record<string, any>, overrides: Record<string, any> = {}) {
  return {
    sections: [],
    fields: [field('GtProjectGoals', 'Mål'), field('GtProjectOwner', 'Eier')],
    columns: [
      column('GtProjectOwner', 'Prosjekteier', 10),
      column('GtProjectGoals', 'Prosjektmål', 20)
    ],
    fieldValues: new ItemFieldValues(values),
    ...overrides
  } as any
}

function useReducerHook() {
  return useProjectInformationReducer(spfxContext)
}

function loaded(values: Record<string, any> = { GtProjectGoals: 'Bygge bro' }) {
  const hook = renderHook(useReducerHook)
  hook.dispatch(
    INIT_DATA({
      state: {
        data: projectData(values),
        userHasEditPermission: true,
        userHasRerunSetupPermission: false,
        hubIsAvailable: true
      }
    })
  )
  return hook
}

const shown = (properties: any[]) =>
  properties.map((p) => [p.internalName, p.displayName, p.getParsedValue()])

describe('ProjectInformation reducer', () => {
  it('starts with nothing loaded: no properties, and no sections or fields', () => {
    const { state } = renderHook(useReducerHook)
    expect(state.isDataLoaded).toBe(false)
    expect(state.properties).toEqual([])
    expect(state.data).toEqual({ sections: [], fields: [] })
  })

  it('takes the fetched data and permissions, shows the properties in column order with their column names and values, and ends loading', () => {
    const hook = renderHook(useReducerHook)
    const state = hook.dispatch(
      INIT_DATA({
        state: {
          data: projectData({ GtProjectGoals: 'Bygge bro' }),
          // Properties handed in with the data are replaced by those built from it.
          properties: [{ internalName: 'Stale' } as any],
          userHasEditPermission: true,
          userHasRerunSetupPermission: false,
          hubIsAvailable: true
        },
        // The handler ignores an error sent with the data; a failed fetch is FETCH_DATA_ERROR.
        error: { message: 'Ignorert' } as any
      })
    )
    expect(state.isDataLoaded).toBe(true)
    expect(state.data.fields.map((f) => f.InternalName)).toEqual([
      'GtProjectGoals',
      'GtProjectOwner'
    ])
    expect(shown(state.properties)).toEqual([
      ['GtProjectOwner', 'Prosjekteier', undefined],
      ['GtProjectGoals', 'Prosjektmål', 'Bygge bro']
    ])
    expect(state.userHasEditPermission).toBe(true)
    expect(state.userHasRerunSetupPermission).toBe(false)
    expect(state.hubIsAvailable).toBe(true)
    expect(state.error).toBeUndefined()
  })

  it('marks a parent project or a program from its field values, and any other project as neither', () => {
    expect(loaded({ GtIsParentProject: true }).state.isParentProject).toBe(true)
    expect(loaded({ GtIsProgram: true }).state.isParentProject).toBe(true)
    expect(loaded({ GtIsParentProject: false }).state.isParentProject).toBeUndefined()
    expect(loaded({}).state.isParentProject).toBeUndefined()
  })

  it('after a save, lays the returned data over the loaded data and shows the new values', () => {
    const hook = loaded()
    const state = hook.dispatch(
      UPDATE_DATA({
        data: {
          fields: [field('GtProjectGoals', 'Mål'), field('GtProjectOwner', 'Eier')],
          fieldValues: new ItemFieldValues({
            GtProjectGoals: 'Bygge tunnel',
            GtProjectOwner: 'Kari'
          })
        }
      })
    )
    // The columns (and the rest of the loaded data) stay, so the order and the names stay too.
    expect(state.data.columns).toHaveLength(2)
    expect(state.data.sections).toEqual([])
    expect(shown(state.properties)).toEqual([
      ['GtProjectOwner', 'Prosjekteier', 'Kari'],
      ['GtProjectGoals', 'Prosjektmål', 'Bygge tunnel']
    ])
    expect(state.properties[0].getProperty('Title')).toBe('Eier')
    expect(state.isDataLoaded).toBe(true)
  })

  it('after a save without fields, keeps the loaded fields, but their properties cannot read the field afterwards', () => {
    // Today's behaviour, pinned: the handler builds the properties from the draft, not from
    // `current(state)` as INIT_DATA does, so a property built from a field kept in the state holds
    // a draft that is revoked once the update is done. The save in EditPropertiesPanel always sends
    // the fields, so the web part does not reach this.
    const hook = loaded()
    const state = hook.dispatch(
      UPDATE_DATA({
        data: { fieldValues: new ItemFieldValues({ GtProjectGoals: 'Bygge tunnel' }) }
      })
    )
    expect(shown(state.properties)).toEqual([
      ['GtProjectOwner', 'Prosjekteier', undefined],
      ['GtProjectGoals', 'Prosjektmål', 'Bygge tunnel']
    ])
    expect(() => state.properties[0].getProperty('Title')).toThrow(/revoked/)
  })

  it('keeps the error of a failed fetch and ends loading, with no properties', () => {
    const hook = renderHook(useReducerHook)
    const state = hook.dispatch(
      FETCH_DATA_ERROR({ error: { message: 'Kilden svarte ikke' } as any })
    )
    expect(state.error.message).toBe('Kilden svarte ikke')
    expect(state.isDataLoaded).toBe(true)
    expect(state.properties).toEqual([])
  })

  it('shows the progress dialog with its title and progress, and hides it when the progress is cleared', () => {
    const hook = loaded()
    const progress = { title: 'Oppretter overordnet prosjekt', progress: { label: 'Steg 1' } }
    expect(hook.dispatch(SET_PROGRESS(progress)).progressDialog).toEqual(progress)
    expect(hook.dispatch(SET_PROGRESS(null)).progressDialog).toBeNull()
  })

  it('opens one panel at a time and closes it, leaving the dialogs alone', () => {
    const hook = loaded()
    hook.dispatch(OPEN_DIALOG('CreateParentDialog'))
    expect(hook.dispatch(OPEN_PANEL('EditPropertiesPanel')).activePanel).toBe('EditPropertiesPanel')
    expect(hook.dispatch(OPEN_PANEL('AllPropertiesPanel')).activePanel).toBe('AllPropertiesPanel')
    const state = hook.dispatch(CLOSE_PANEL())
    expect(state.activePanel).toBeNull()
    expect(state.activeDialog).toBe('CreateParentDialog')
  })

  it('opens one dialog at a time and closes it, leaving the panels alone', () => {
    const hook = loaded()
    hook.dispatch(OPEN_PANEL('AllPropertiesPanel'))
    expect(hook.dispatch(OPEN_DIALOG('CreateParentDialog')).activeDialog).toBe('CreateParentDialog')
    expect(hook.dispatch(OPEN_DIALOG('RunProjectSetupDialog')).activeDialog).toBe(
      'RunProjectSetupDialog'
    )
    const state = hook.dispatch(CLOSE_DIALOG())
    expect(state.activeDialog).toBeNull()
    expect(state.activePanel).toBe('AllPropertiesPanel')
  })

  it('stamps the time of a property update that asks for a refetch, and ignores one that does not', () => {
    const hook = loaded()
    expect(
      hook.dispatch(PROPERTIES_UPDATED({ refetch: false })).propertiesLastUpdated
    ).toBeUndefined()
    const before = Date.now()
    const stamped = hook.dispatch(PROPERTIES_UPDATED({ refetch: true })).propertiesLastUpdated
    expect(stamped).toBeInstanceOf(Date)
    expect(stamped.getTime()).toBeGreaterThanOrEqual(before)
    expect(hook.dispatch(PROPERTIES_UPDATED({ refetch: false })).propertiesLastUpdated).toBe(
      stamped
    )
  })
})
