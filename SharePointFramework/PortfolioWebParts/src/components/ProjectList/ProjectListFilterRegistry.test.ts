import strings from 'PortfolioWebPartsStrings'
import { convertConfigsToVerticals, findDefaultVertical } from './ProjectListFilterRegistry'
import { IVerticalConfig } from './types'

/**
 * The project list's tabs ("verticals") as the web part's properties configure them: a JSON
 * condition on the projects' fields, on the model's computed properties, on the list's state
 * (which also hides the tab), and on access. A condition that does not parse is no condition.
 */
const vertical = (overrides: Partial<IVerticalConfig> = {}): IVerticalConfig => ({
  title: 'Alle prosjekter',
  iconName: 'Cube',
  clientFilter: '',
  fieldFilter: '',
  visibilityRule: '',
  requiresAccess: false,
  isDefault: false,
  searchBoxPlaceholder: '',
  ...overrides
})

const project = (data: Record<string, any> = {}, model: Record<string, any> = {}) =>
  ({ data, hasUserAccess: false, ...model }) as any

const state = (overrides: Record<string, any> = {}) =>
  ({ isUserInPortfolioManagerGroup: false, ...overrides }) as any

/** The filter of a single vertical configured with `overrides`. */
const filterOf = (overrides: Partial<IVerticalConfig>) =>
  convertConfigsToVerticals([vertical(overrides)])[0].filter

describe('convertConfigsToVerticals', () => {
  it('makes a tab of each configuration, keyed by its place, with the default placeholder when none is set', () => {
    const [all, mine] = convertConfigsToVerticals([
      vertical(),
      vertical({ title: 'Mine prosjekter', searchBoxPlaceholder: 'Søk i mine' })
    ])
    expect(all).toMatchObject({
      key: 'vertical-0',
      value: 'vertical-0',
      text: 'Alle prosjekter',
      searchBoxPlaceholder: strings.SearchBoxPlaceholderText
    })
    expect(all.icon).toBeTruthy()
    expect(all.isHidden).toBeUndefined()
    expect(mine).toMatchObject({ key: 'vertical-1', searchBoxPlaceholder: 'Søk i mine' })
  })

  it('shows every project without conditions, and a condition that does not parse is none', () => {
    expect(filterOf({})(project(), state())).toBe(true)
    expect(filterOf({ fieldFilter: '{not json' })(project(), state())).toBe(true)
    // An access requirement left out of the configuration is no requirement.
    expect(filterOf({ requiresAccess: undefined })(project(), state())).toBe(true)
  })

  it('compares a plain field value loosely, so SharePoint\'s "1" is true', () => {
    const programs = filterOf({ fieldFilter: '{"GtIsProgram": true}' })
    expect(programs(project({ GtIsProgram: '1' }), state())).toBe(true)
    expect(programs(project({ GtIsProgram: '0' }), state())).toBe(false)
    // A null condition matches a field without a value.
    const unset = filterOf({ fieldFilter: '{"GtProjectPhase": null}' })
    expect(unset(project({}), state())).toBe(true)
    expect(unset(project({ GtProjectPhase: 'Konsept' }), state())).toBe(false)
  })

  it('reads an object as operators: $ne, $in and $nin, a single value or a list', () => {
    const open = filterOf({ fieldFilter: '{"GtProjectLifecycleStatus": {"$ne": "Avsluttet"}}' })
    expect(open(project({ GtProjectLifecycleStatus: 'Aktiv' }), state())).toBe(true)
    expect(open(project({ GtProjectLifecycleStatus: 'Avsluttet' }), state())).toBe(false)

    const running = filterOf({
      fieldFilter: '{"GtProjectPhase": {"$in": ["Planlegge", "Gjennomføre"]}}'
    })
    expect(running(project({ GtProjectPhase: 'Planlegge' }), state())).toBe(true)
    expect(running(project({ GtProjectPhase: 'Konsept' }), state())).toBe(false)
    expect(
      filterOf({ fieldFilter: '{"GtProjectPhase": {"$in": "Konsept"}}' })(
        project({ GtProjectPhase: 'Konsept' }),
        state()
      )
    ).toBe(true)

    const notStarted = filterOf({ fieldFilter: '{"GtProjectPhase": {"$nin": ["Konsept"]}}' })
    expect(notStarted(project({ GtProjectPhase: 'Konsept' }), state())).toBe(false)
    expect(notStarted(project({ GtProjectPhase: 'Planlegge' }), state())).toBe(true)
    expect(
      filterOf({ fieldFilter: '{"GtProjectPhase": {"$nin": "Konsept"}}' })(
        project({ GtProjectPhase: 'Konsept' }),
        state()
      )
    ).toBe(false)
  })

  it('lets an operator object with no known operator match everything, so a typo widens the tab', () => {
    const typo = filterOf({ fieldFilter: '{"GtProjectPhase": {"$nein": "Konsept"}}' })
    expect(typo(project({ GtProjectPhase: 'Konsept' }), state())).toBe(true)
  })

  it('skips the field conditions for a project without its fields', () => {
    const programs = filterOf({ fieldFilter: '{"GtIsProgram": true}' })
    expect(programs({ hasUserAccess: false } as any, state())).toBe(true)
  })

  it("checks a client condition against the model's computed properties", () => {
    const member = filterOf({ clientFilter: '{"isUserMember": true}' })
    expect(member(project({}, { isUserMember: true }), state())).toBe(true)
    expect(member(project({}, { isUserMember: false }), state())).toBe(false)
  })

  it("gates the projects and hides the tab on the list's state", () => {
    const [managers] = convertConfigsToVerticals([
      vertical({ visibilityRule: '{"isUserInPortfolioManagerGroup": true}' })
    ])
    expect(managers.isHidden(state({ isUserInPortfolioManagerGroup: true }))).toBe(false)
    expect(managers.isHidden(state())).toBe(true)
    expect(managers.filter(project(), state({ isUserInPortfolioManagerGroup: true }))).toBe(true)
    expect(managers.filter(project(), state())).toBe(false)
  })

  it('shows a portfolio manager every project, and others those they have access to, when access is required', () => {
    const access = filterOf({ requiresAccess: true })
    expect(access(project(), state({ isUserInPortfolioManagerGroup: true }))).toBe(true)
    expect(access(project({}, { hasUserAccess: true }), state())).toBe(true)
    expect(access(project(), state())).toBe(false)
  })
})

describe('findDefaultVertical', () => {
  const configs = [vertical(), vertical({ title: 'Mine', isDefault: true })]
  const verticals = convertConfigsToVerticals(configs)

  it('picks the tab configured as default, else the first', () => {
    expect(findDefaultVertical(configs, verticals)).toBe(verticals[1])
    expect(findDefaultVertical([vertical(), vertical()], verticals)).toBe(verticals[0])
  })

  it('picks the first when the default is past the tabs there are, and none without tabs', () => {
    expect(
      findDefaultVertical([vertical(), vertical(), vertical({ isDefault: true })], verticals)
    ).toBe(verticals[0])
    expect(findDefaultVertical(configs, [])).toBeUndefined()
  })
})
