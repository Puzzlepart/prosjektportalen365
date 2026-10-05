import { deleteCustomizer } from './deleteCustomizer'

/** The customizer's site with its user custom actions; `deleted` records what was deleted. */
function customizerOnSite(
  customActions: { Id: string; ClientSideComponentId: string }[],
  failWith?: Error
) {
  const deleted: string[] = []
  const userCustomActions: any = () =>
    failWith ? Promise.reject(failWith) : Promise.resolve(customActions)
  userCustomActions.getById = (id: string) => ({
    delete: () => {
      deleted.push(id)
      return Promise.resolve()
    }
  })
  const instance = { componentId: 'setup-component', sp: { web: { userCustomActions } } } as any
  return { instance, deleted }
}

describe('deleteCustomizer', () => {
  it("deletes the customizer's own custom action and no other", async () => {
    const { instance, deleted } = customizerOnSite([
      { Id: 'a', ClientSideComponentId: 'other-component' },
      { Id: 'b', ClientSideComponentId: 'setup-component' },
      { Id: 'c', ClientSideComponentId: 'setup-component' }
    ])
    await deleteCustomizer(instance)
    expect(deleted).toEqual(['b'])
  })

  it('leaves the custom action for an owner when the user may not delete it', async () => {
    const { instance, deleted } = customizerOnSite([], new Error('403 Forbidden'))
    await expect(deleteCustomizer(instance)).resolves.toBeUndefined()
    expect(deleted).toEqual([])
  })
})
