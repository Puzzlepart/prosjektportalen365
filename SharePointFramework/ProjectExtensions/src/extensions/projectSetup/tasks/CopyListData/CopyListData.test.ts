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

/** The columns of the project's «Fasesjekkliste», the rows' KeyColumn among them. */
const COLUMNS = ['ID', 'Title', 'GtSortOrder', 'GtProjectPhase', 'GtDataRowUniqueKey']

/** Each read of the project's list's columns: the list's title and the selected properties. */
let columnReads: Array<{ list: string; select: string[] }> = []

/**
 * Task parameters for a project whose destination list exists, unless `missing` says not, and
 * has the `columns` (internal names), or fails to read them with `columns` when it is an error.
 */
function taskParams({
  missing = false,
  columns = COLUMNS
}: { missing?: boolean; columns?: string[] | Error } = {}) {
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
  const fields = (list: string) => ({
    select:
      (...select: string[]) =>
      () => {
        columnReads.push({ list, select })
        return columns instanceof Error
          ? Promise.reject(columns)
          : Promise.resolve(columns.map((InternalName) => ({ InternalName })))
      }
  })
  return {
    web: {
      lists: {
        getByTitle: (list: string) => ({ select: () => destination, fields: fields(list) })
      }
    },
    context: { pageContext: { legacyPageContext: { groupId: 'group-1' } } }
  } as any
}

/**
 * Copies `contentConfig` into a project with the `params` and returns the list the engine was
 * given, and what was logged.
 */
async function copy(contentConfig: CloudContentConfig, params = taskParams()) {
  const onProgress = jest.fn()
  await new CopyListData({ selectedContentConfig: [contentConfig] } as any).execute(
    params,
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

/**
 * Subscribes to the `Logger` of `@pnp/logging` the tasks log to, and returns the warnings logged
 * from then on.
 */
function loggedWarnings() {
  const warnings: string[] = []
  jest.requireMock('@pnp/logging').Logger.subscribe({
    log: ({ message, level }: { message: string; level: number }) => {
      if (level === 2) warnings.push(message)
    }
  })
  return warnings
}

beforeEach(() => {
  engine.setups = []
  engine.applied = []
  engine.log = []
  columnReads = []
})

describe('CopyListData', () => {
  it("keeps the rows' KeyColumn among the fields of a cloud template's content when the project's list has that column, so a re-run updates the rows", async () => {
    const { list, logged } = await copy(
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
    expect(columnReads).toEqual([{ list: 'Fasesjekkliste', select: ['InternalName'] }])
    expect(logged('warning')).toEqual([])
  })

  it("leaves out a KeyColumn the project's list does not have, so the rows are added, and says so in the step's log", async () => {
    const warnings = loggedWarnings()
    const { list, logged } = await copy(
      cloudContent('GtSortOrder,Title,GtProjectPhase', {
        KeyColumn: 'GtDataRowUniqueKey',
        UpdateBehavior: 'Skip',
        Rows: ROWS
      }),
      taskParams({ columns: ['ID', 'Title', 'GtSortOrder', 'GtProjectPhase'] })
    )
    expect(list.DataRows).toStrictEqual({
      UpdateBehavior: 'Skip',
      Rows: ROWS.map(({ Title, GtSortOrder, GtProjectPhase }) => ({
        GtSortOrder,
        Title,
        GtProjectPhase
      }))
    })
    const message = format(
      strings.CloudContentConfigKeyColumnMissing,
      'Fasesjekkliste',
      'GtDataRowUniqueKey'
    )
    expect(logged('warning')).toEqual([message])
    expect(warnings).toEqual([`(ProjectSetup) [CopyListData]: ${message}`])
    expect(columnReads).toHaveLength(1)
  })

  it("leaves the values of a KeyColumn the project's list does not have out of whole rows too", async () => {
    const { list } = await copy(
      cloudContent('', { KeyColumn: 'GtDataRowUniqueKey', Rows: ROWS }),
      taskParams({ columns: ['ID', 'Title', 'GtSortOrder', 'GtProjectPhase'] })
    )
    expect(list.DataRows).not.toHaveProperty('KeyColumn')
    expect(list.DataRows.Rows).toStrictEqual(
      ROWS.map(({ Title, GtSortOrder, GtProjectPhase }) => ({ Title, GtSortOrder, GtProjectPhase }))
    )
  })

  it("keys the rows by Title when the bundle names no KeyColumn, without reading the list's columns", async () => {
    const { list, logged } = await copy(
      cloudContent('GtSortOrder', { Rows: ROWS }),
      taskParams({ columns: [] })
    )
    expect(list.DataRows.KeyColumn).toBe('Title')
    expect(list.DataRows.Rows).toEqual([
      { GtSortOrder: 1, Title: 'Avklare mål' },
      { GtSortOrder: 2, Title: 'Velge bane' }
    ])
    expect(columnReads).toEqual([])
    expect(logged('warning')).toEqual([])
  })

  it("keeps the rows' KeyColumn when the list's columns cannot be read, and logs the failure", async () => {
    const warnings = loggedWarnings()
    const { list, logged } = await copy(
      cloudContent('GtSortOrder,Title', { KeyColumn: 'GtDataRowUniqueKey', Rows: ROWS }),
      taskParams({ columns: new Error('Too many requests') })
    )
    expect(list.DataRows).toEqual({
      KeyColumn: 'GtDataRowUniqueKey',
      UpdateBehavior: 'Overwrite',
      Rows: ROWS.map(({ GtDataRowUniqueKey, Title, GtSortOrder }) => ({
        GtSortOrder,
        Title,
        GtDataRowUniqueKey
      }))
    })
    expect(warnings).toEqual([
      "(ProjectSetup) [CopyListData]: Could not read the columns of list 'Fasesjekkliste' to check for 'GtDataRowUniqueKey', which the rows are matched by, so it is used: Too many requests"
    ])
    expect(logged('warning')).toEqual([])
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
      } as any).execute(taskParams({ missing: true }), jest.fn())
    ).rejects.toMatchObject({ message: strings.CopyListDataErrorMessage })
    expect(engine.applied).toEqual([])
  })
})
