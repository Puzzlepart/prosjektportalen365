// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter and the hub reads are stand-ins.
const hub = { isAvailable: true, timelineError: null as Error | null }
jest.mock('data/SPDataAdapter', () => ({
  __esModule: true,
  default: {
    get portalDataService() {
      return { isAvailable: hub.isAvailable }
    },
    project: {
      getProjectInformationData: () => Promise.resolve({ templateParameters: {} })
    }
  }
}))
jest.mock('./fetchTimelineConfiguration', () => ({
  fetchTimelineConfiguration: () =>
    hub.timelineError ? Promise.reject(hub.timelineError) : Promise.resolve([])
}))
jest.mock('./fetchTimelineData', () => ({ fetchTimelineData: () => Promise.resolve(null) }))
jest.mock('./fetchProjectData', () => ({
  fetchProjectData: () => Promise.resolve({ project: {}, projectId: 1 })
}))

import strings from 'ProjectWebPartsStrings'
import { fetchData } from './fetchData'

const forbidden = () => Object.assign(new Error('403 FORBIDDEN'), { status: 403 })

beforeEach(() => {
  hub.isAvailable = true
  hub.timelineError = null
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => jest.restoreAllMocks())

describe('ProjectTimeline fetchData', () => {
  it('says the hub is out of reach when it is', async () => {
    hub.isAvailable = false
    const { error } = await fetchData({} as any)
    expect(error?.message).toBe(strings.ProjectTimelineNoHubAccessErrorText)
  })

  it('says access is missing when a hub list is denied, as for «Minimum lesetilganger på hub»', async () => {
    hub.timelineError = forbidden()
    const { error } = await fetchData({} as any)
    expect(error?.message).toBe(strings.ProjectTimelineNoHubAccessErrorText)
  })

  it('keeps the message of another error', async () => {
    hub.timelineError = new Error('500 Server Error')
    const { error } = await fetchData({} as any)
    expect(error?.message).toBe('500 Server Error')
  })
})
