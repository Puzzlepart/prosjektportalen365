// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. DEBUG sets the engine's log level. `@pnp/logging` gets a working
// `Logger`, and a batch runs its requests as they are made; the engine is a stand-in that records
// the schemas it applies and logs `engine.log`; Planner already has a plan, so the task makes none.
;(globalThis as any).DEBUG = false
import type { IEngineRecord } from '../testFixtures'
const engine: IEngineRecord = { setups: [], applied: [] }
jest.mock('@pnp/logging', () =>
  jest.requireActual('../testFixtures').fakeLogging({
    createBatch: () => [{}, () => Promise.resolve()]
  })
)
jest.mock('sp-js-provisioning', () => jest.requireActual('../testFixtures').fakeEngine(engine))
jest.mock('../PlannerConfiguration', () => ({
  PlannerConfiguration: class {
    public _fetchPlans() {
      return Promise.resolve([{ title: 'Frisbeegolfbane' }])
    }
  },
  TaskAttachment: class {}
}))
jest.mock('../TimelineConfiguration', () => ({ TimelineConfiguration: class {} }))

import strings from 'ProjectExtensionsStrings'
import { CloudContentConfig, ContentConfigType, format } from 'pp365-shared-library'
import { CopyListData } from '.'

const ROWS = [
  { GtDataRowUniqueKey: 'fase-1', Title: 'Avklare mål', GtSortOrder: 1, GtProjectPhase: 'Konsept' },
  { GtDataRowUniqueKey: 'fase-2', Title: 'Velge bane', GtSortOrder: 2, GtProjectPhase: 'Konsept' }
]

/**
 * A cloud template's list content: `fields` of the bundled rows, and the bundled `folders`, copied
 * from «Fasesjekkliste» on the hub template into the project's «Fasesjekkliste».
 */
function cloudContent(fields: string, dataRows?: Record<string, any>, folders?: any[]) {
  return CloudContentConfig.fromManifest(
    { title: 'Fasesjekkliste', sourceList: 'Fasesjekkliste', fields } as any,
    {
      getHubListDataRows: () => Promise.resolve(dataRows),
      getHubListFolders: () => Promise.resolve(folders)
    } as any,
    1
  )
}

/**
 * A hub list's content: «Fasesjekkliste» on the hub copied into the project's, `Title` and
 * `GtSortOrder` of each item. The project's list refuses the items titled in `refused`.
 */
function hubContent(items: Array<Record<string, any>>, refused: string[] = []) {
  const query = {
    top: () =>
      (async function* () {
        yield items
      })()
  }
  return {
    type: ContentConfigType.List,
    text: 'Fasesjekkliste',
    load: () => Promise.resolve(),
    fields: ['Title', 'GtSortOrder'],
    sourceListProps: { BaseTemplate: 100, ItemCount: items.length, Title: 'Fasesjekkliste' },
    destListProps: { Title: 'Fasesjekkliste' },
    sourceList: {
      items: { select: () => ({ expand: () => query }) },
      fields: {
        select: () => () =>
          Promise.resolve([
            { InternalName: 'Title', TypeAsString: 'Text' },
            { InternalName: 'GtSortOrder', TypeAsString: 'Number' }
          ])
      }
    },
    destList: {
      items: {
        using: () => ({
          add: (properties: Record<string, any>) =>
            refused.includes(properties.Title)
              ? Promise.reject(new Error('Column GtSortOrder does not exist'))
              : Promise.resolve({})
        })
      }
    }
  } as any
}

/** Task parameters for a project whose destination list exists, unless `missing` says not. */
function taskParams(missing = false) {
  const destination = Object.assign(
    () =>
      missing
        ? Promise.reject(new Error('List does not exist'))
        : Promise.resolve({
            BaseTemplate: 101,
            Description: 'Sjekkpunkter',
            ContentTypesEnabled: true
          }),
    { select: () => destination }
  )
  return {
    web: { lists: { getByTitle: () => ({ select: () => destination }) } },
    context: { pageContext: { legacyPageContext: { groupId: 'group-1' } } }
  } as any
}

/** Copies `contentConfig` and returns the list the engine was given, and what was logged. */
async function copy(contentConfig: CloudContentConfig) {
  const onProgress = jest.fn()
  await new CopyListData({ selectedContentConfig: [contentConfig] } as any).execute(
    taskParams(),
    onProgress
  )
  const [list] = engine.applied[0]?.Lists ?? []
  const logged = (level: string) =>
    onProgress.mock.calls
      .map(([, , , logEntry]) => logEntry)
      .filter((logEntry) => logEntry?.level === level)
      .map(({ message }) => message)
  return { list, logged, onProgress }
}

beforeEach(() => {
  engine.setups = []
  engine.applied = []
  engine.log = []
})

describe('CopyListData', () => {
  it("keeps the rows' KeyColumn among the fields of a cloud template's content, so a re-run updates the rows", async () => {
    const { list } = await copy(
      cloudContent('GtSortOrder,Title,GtProjectPhase', {
        KeyColumn: 'GtDataRowUniqueKey',
        Rows: ROWS
      })
    )
    expect(list.DataRows).toEqual({
      KeyColumn: 'GtDataRowUniqueKey',
      UpdateBehavior: 'Overwrite',
      Rows: ROWS.map(({ GtDataRowUniqueKey, Title, GtSortOrder, GtProjectPhase }) => ({
        GtSortOrder,
        Title,
        GtProjectPhase,
        GtDataRowUniqueKey
      }))
    })
  })

  it('keys the rows by Title when the bundle names no KeyColumn', async () => {
    const { list } = await copy(cloudContent('GtSortOrder', { Rows: ROWS }))
    expect(list.DataRows.KeyColumn).toBe('Title')
    expect(list.DataRows.Rows).toEqual([
      { GtSortOrder: 1, Title: 'Avklare mål' },
      { GtSortOrder: 2, Title: 'Velge bane' }
    ])
  })

  it('copies the whole rows when the content names no fields', async () => {
    const { list } = await copy(cloudContent('', { KeyColumn: 'GtDataRowUniqueKey', Rows: ROWS }))
    expect(list.DataRows.Rows).toEqual(ROWS)
  })

  it("adds the engine's warnings and errors to the step's log", async () => {
    engine.log = [
      [1, '(Lists): (processDataRows): Row 0 added'],
      [
        2,
        '(Lists): (processDataRows): Row 1 in list Fasesjekkliste has no value for its KeyColumn'
      ],
      [3, '(Lists): (processDataRows): Failed to add row 2 to list Fasesjekkliste']
    ]
    const { logged, onProgress } = await copy(
      cloudContent('', { KeyColumn: 'GtDataRowUniqueKey', Rows: ROWS })
    )
    expect(logged('warning')).toEqual([
      '(Lists): (processDataRows): Row 1 in list Fasesjekkliste has no value for its KeyColumn'
    ])
    expect(logged('error')).toEqual([
      '(Lists): (processDataRows): Failed to add row 2 to list Fasesjekkliste'
    ])
    const [errorCall] = onProgress.mock.calls.filter(
      ([, , , logEntry]) => logEntry?.level === 'error'
    )
    expect(errorCall.slice(0, 3)).toEqual([
      format(strings.CopyListItemsText, 2, 'Fasesjekkliste', 'Fasesjekkliste'),
      '',
      'List'
    ])
  })

  it("adds the items it could not copy from a hub list to the step's log, and goes on", async () => {
    let consoleLines = 0
    jest.requireMock('@pnp/logging').Logger.subscribe({ log: () => consoleLines++ })
    const { logged } = await copy(
      hubContent(
        [
          { Title: 'Avklare mål', GtSortOrder: 1 },
          { Title: 'Velge bane', GtSortOrder: 2 }
        ],
        ['Velge bane']
      )
    )
    expect(logged('error')).toEqual([
      "Failed to add item 'Velge bane' to list 'Fasesjekkliste': Column GtSortOrder does not exist"
    ])
    expect(logged('warning')).toEqual([
      "1 of 2 item(s) could not be copied from 'Fasesjekkliste' to 'Fasesjekkliste'"
    ])
    expect(consoleLines).toBe(2)
  })

  it("states the destination's own settings, so the engine changes none of them", async () => {
    const { list } = await copy(cloudContent('', { Rows: ROWS }))
    expect(list).toMatchObject({
      Title: 'Fasesjekkliste',
      Description: 'Sjekkpunkter',
      Template: 101,
      ContentTypesEnabled: true
    })
  })

  it("copies a cloud template's folders, counted through the whole tree", async () => {
    const folders = [{ Name: 'Fase 1', Folders: [{ Name: 'Møter' }] }, { Name: 'Fase 2' }]
    const { list, onProgress } = await copy(cloudContent('', undefined, folders))
    expect(list.Folders).toEqual(folders)
    expect(list.DataRows).toBeUndefined()
    expect(onProgress).toHaveBeenCalledWith(
      format(strings.CopyFilesText, 3, 'Fasesjekkliste', 'Fasesjekkliste'),
      '',
      'Documentation'
    )
  })

  it('applies nothing when the cloud template bundles neither rows nor folders', async () => {
    const { list } = await copy(cloudContent('', { Rows: [] }))
    expect(list).toBeUndefined()
  })

  it('fails, rather than make a list of its own, when the project lacks the destination list', async () => {
    await expect(
      new CopyListData({
        selectedContentConfig: [cloudContent('', { Rows: ROWS })]
      } as any).execute(taskParams(true), jest.fn())
    ).rejects.toMatchObject({ message: strings.CopyListDataErrorMessage })
    expect(engine.applied).toEqual([])
  })
})
