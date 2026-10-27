// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The hub is a stand-in: `hub.ideaUpdates` records the idea
// updates, and the entity service passed in the task parameters records the project entries.
const hub = { ideaUpdates: [] as any[] }
jest.mock('../../../../data', () => ({
  SPDataAdapter: {
    portalDataService: {
      updateIdeaData: (...args: any[]) => {
        hub.ideaUpdates.push(args)
        return Promise.resolve(true)
      }
    },
    getMappedProjectProperties: () => Promise.resolve({})
  }
}))

import strings from 'ProjectExtensionsStrings'
import { SetupProjectInformation } from '.'

const PROJECT = 'https://contoso.sharepoint.com/sites/frisbee'

/** Setup data for a project with project data, set up with the default template. */
function setupData(overrides: Record<string, any> = {}) {
  return {
    selectedTemplate: { id: 1, text: 'Standardmal', isProgram: false, isParentProject: false },
    selectedExtensions: [],
    selectedContentConfig: [],
    projectData: { id: 7 },
    ...overrides
  } as any
}

/** Task parameters for the project site; `createNewEntity` stands in for the hub entry. */
function taskParams(createNewEntity: jest.Mock) {
  const items = Object.assign(() => Promise.resolve([]), {
    add: jest.fn(() => Promise.resolve()),
    getById: () => ({ update: jest.fn(() => Promise.resolve()) })
  })
  return {
    templateSchema: { Parameters: { ProjectContentTypeId: '0x0100abc' }, Version: '1.15.0' },
    portalDataService: { syncList: () => Promise.resolve({ list: { items } }) },
    entityService: { getEntityItem: jest.fn(() => Promise.resolve(undefined)), createNewEntity },
    properties: {},
    context: {
      pageContext: {
        legacyPageContext: { groupId: 'group-1' },
        site: { id: { toString: () => 'site-2' } },
        web: { absoluteUrl: PROJECT, title: 'Frisbeegolfbane' }
      }
    },
    items
  } as any
}

/** The warning entries the task reported to the advanced log. */
const warnings = (onProgress: jest.Mock) =>
  onProgress.mock.calls
    .map(([, , , logEntry]) => logEntry)
    .filter((logEntry) => logEntry?.level === 'warning')
    .map(({ message }) => message)

beforeEach(() => {
  hub.ideaUpdates = []
})

describe('SetupProjectInformation', () => {
  it('stores the project properties and registers the project on the hub', async () => {
    const createNewEntity = jest.fn(() => Promise.resolve({}))
    const params = taskParams(createNewEntity)
    const onProgress = jest.fn()
    await new SetupProjectInformation(setupData()).execute(params, onProgress)
    expect(params.items.add).toHaveBeenCalled()
    expect(createNewEntity).toHaveBeenCalledWith(
      'group-1',
      PROJECT,
      expect.objectContaining({ GtSiteId: 'site-2', Title: 'Frisbeegolfbane' })
    )
    expect(hub.ideaUpdates).toHaveLength(1)
    expect(warnings(onProgress)).toEqual([])
  })

  it('stores the project properties but writes nothing to the hub without write access to it', async () => {
    const createNewEntity = jest.fn(() => Promise.resolve({}))
    const params = taskParams(createNewEntity)
    const onProgress = jest.fn()
    await new SetupProjectInformation(setupData({ hasHubWriteAccess: false })).execute(
      params,
      onProgress
    )
    expect(params.items.add).toHaveBeenCalled()
    expect(params.entityService.getEntityItem).not.toHaveBeenCalled()
    expect(createNewEntity).not.toHaveBeenCalled()
    expect(hub.ideaUpdates).toEqual([])
    expect(warnings(onProgress)).toEqual([strings.HubWriteSkippedLogText])
  })

  it('goes on without the hub, and tells the other tasks, when the hub rejects the project entry', async () => {
    const denied = Object.assign(new Error('Access is denied.'), { status: 403 })
    const createNewEntity = jest.fn(() => Promise.reject(denied))
    const data = setupData()
    const onProgress = jest.fn()
    await new SetupProjectInformation(data).execute(taskParams(createNewEntity), onProgress)
    expect(data.hasHubWriteAccess).toBe(false)
    expect(hub.ideaUpdates).toEqual([])
    const [warning] = warnings(onProgress)
    expect(warning).toContain('403')
  })

  it('fails on any other error from the hub', async () => {
    const failed = Object.assign(new Error('Serverfeil'), { status: 500 })
    const createNewEntity = jest.fn(() => Promise.reject(failed))
    const data = setupData()
    await expect(
      new SetupProjectInformation(data).execute(taskParams(createNewEntity), jest.fn())
    ).rejects.toMatchObject({ message: strings.SetupProjectInformationErrorMessage })
    expect(data.hasHubWriteAccess).toBeUndefined()
  })
})
