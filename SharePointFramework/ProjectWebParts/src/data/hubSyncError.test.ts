import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import resource from 'SharedResources'
import { getHubSyncErrorReason } from './hubSyncError'

describe('getHubSyncErrorReason', () => {
  it('says in words that the user cannot write to the hub when the hub refuses', () => {
    const denied = Object.assign(new Error('Access is denied.'), { status: 403 })
    expect(getHubSyncErrorReason(denied)).toBe(
      format(strings.HubSyncNoWriteAccessReason, resource.Lists_Projects_Title)
    )
  })

  it("gives any other error's own message", () => {
    expect(getHubSyncErrorReason(new Error('Serverfeil'))).toBe('Serverfeil')
    expect(getHubSyncErrorReason('Tidsavbrudd')).toBe('Tidsavbrudd')
  })
})
