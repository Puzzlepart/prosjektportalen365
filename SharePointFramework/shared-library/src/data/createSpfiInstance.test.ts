// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. `spfi().using(behaviour)` records the behaviour it was given,
// and `SPFx(context)` names the context it was built from, so the test reads which one was used.
// The harness maps every `@pnp/*` path to one stub file, so this mock also stands for the
// `@pnp/sp/presets/all` the module imports for its side effects.
jest.mock('@pnp/sp', () => ({
  SPFx: jest.fn((context: any) => `SPFx(${context.name})`),
  spfi: jest.fn(() => ({ using: (behaviour: unknown) => ({ behaviour }) }))
}))

import { createSpfiInstance, setSpfiFactory } from './createSpfiInstance'

/**
 * How the library's clients connect to SharePoint: through SPFx on a page, or through a factory
 * the integration tests register, which signs in from Node where there is no page.
 */
describe('createSpfiInstance', () => {
  const context = { name: 'project' } as any

  afterEach(() => setSpfiFactory(undefined))

  it('connects through SPFx by default', () => {
    expect((createSpfiInstance(context) as any).behaviour).toBe('SPFx(project)')
  })

  it('connects through a registered factory, given the same context', () => {
    const factory = jest.fn((c: any) => `signed in to ${c.name}`)
    setSpfiFactory(factory as any)
    expect((createSpfiInstance(context) as any).behaviour).toBe('signed in to project')
    expect(factory).toHaveBeenCalledWith(context)
  })

  it('connects through SPFx again once the factory is removed', () => {
    setSpfiFactory((() => 'factory') as any)
    setSpfiFactory(undefined)
    expect((createSpfiInstance(context) as any).behaviour).toBe('SPFx(project)')
  })
})
