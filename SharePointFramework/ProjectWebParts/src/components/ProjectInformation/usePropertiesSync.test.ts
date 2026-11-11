// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter syncs to the hub (`adapter.syncPropertyItemToHub`).
const adapter = {
  portalDataService: { syncList: jest.fn(() => Promise.resolve({ created: false })) },
  syncPropertyItemToHub: jest.fn(),
  clearCache: jest.fn()
}
jest.mock('../../data', () => ({ __esModule: true, default: adapter }))
jest.mock('./index', () => ({ ProjectInformation: { displayName: 'Project Information' } }))
jest.mock('pp365-shared-library/lib/logging', () => ({
  ListLogger: { log: jest.fn(() => Promise.resolve()) }
}))

import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import resource from 'SharedResources'
import { SET_HUB_SYNC_WARNING, SET_PROGRESS } from './reducer'
import { usePropertiesSync } from './usePropertiesSync'

/**
 * Saving project information syncs it to the hub. A sync the hub did not take leaves the saved
 * properties on the project and shows the reason in the web part; the next sync clears it.
 */
function context() {
  return {
    props: { webAbsoluteUrl: '/sites/frisbee', webTitle: 'Frisbeegolfbane' },
    state: { data: { fieldValues: {}, templateParameters: {} } },
    dispatch: jest.fn()
  } as any
}

/** Syncs as saving project information does, and returns what the sync dispatched. */
async function sync() {
  const projectInformation = context()
  await usePropertiesSync(projectInformation)({
    syncList: true,
    syncPropertyItemToHub: true,
    data: projectInformation.state.data,
    onProgress: () => null
  })
  return projectInformation.dispatch.mock.calls.map(([action]) => action)
}

beforeEach(() => {
  adapter.syncPropertyItemToHub.mockReset()
})

describe('usePropertiesSync', () => {
  it('syncs to the hub and clears an earlier warning', async () => {
    adapter.syncPropertyItemToHub.mockResolvedValue(undefined)
    expect(await sync()).toEqual([SET_HUB_SYNC_WARNING(null), SET_PROGRESS(null)])
    expect(adapter.syncPropertyItemToHub).toHaveBeenCalled()
  })

  it('warns with the reason when the hub does not take the sync', async () => {
    adapter.syncPropertyItemToHub.mockRejectedValue(
      Object.assign(new Error('Access is denied.'), { status: 403 })
    )
    expect(await sync()).toContainEqual(
      SET_HUB_SYNC_WARNING(
        format(
          strings.ProjectPropertiesNotSyncedToHubText,
          format(strings.HubSyncNoWriteAccessReason, resource.Lists_Projects_Title)
        )
      )
    )
  })
})
