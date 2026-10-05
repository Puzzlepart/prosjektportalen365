import ProjectUpgrade from '.'

describe('ProjectUpgrade', () => {
  it('does nothing on the page: the upgrade runs from the installer', async () => {
    await expect(new ProjectUpgrade().onInit()).resolves.toBeUndefined()
  })
})
