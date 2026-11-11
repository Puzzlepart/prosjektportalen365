import resource from 'SharedResources'

/**
 * Structural stand-ins for the command sets' tests, in the spirit of the shared library's
 * `pnpShapes.ts`: the PnPjs chains the command sets call, a list view row, the SPFx context and
 * an idea configuration. Real PnPjs and SPFx objects satisfy the same shapes.
 */

export const HUB = 'https://contoso.sharepoint.com/sites/pp365'
export const PROCESSING_LIST = resource.Lists_IdeaProcessing_Title
export const REGISTRATION_LIST = resource.Lists_IdeaRegistration_Title
export const USER = 'kari@contoso.no'

/** An update recorded by {@link fakeSp}. */
export interface IRecordedUpdate {
  list: string
  id: number
  properties: Record<string, any>
}

/** An item added through {@link fakeSp}. */
export interface IRecordedAdd {
  list: string
  properties: Record<string, any>
}

/**
 * A PnPjs `SPFI` stand-in that answers list reads from `lists` (by list title) and group members
 * from `groups` (by group name), and records every item update and add. Added items get the ids
 * 101, 102 and so on.
 */
export function fakeSp(
  lists: Record<string, any[]> = {},
  groups: Record<string, { Email: string }[]> = {}
) {
  const updates: IRecordedUpdate[] = []
  const adds: IRecordedAdd[] = []
  const getByTitle = (title: string) => {
    const items: any = () => Promise.resolve(lists[title] ?? [])
    items.select = () => items
    items.getById = (id: number) => ({
      update: (properties: Record<string, any>) => {
        updates.push({ list: title, id, properties })
        return Promise.resolve(properties)
      }
    })
    items.add = (properties: Record<string, any>) => {
      adds.push({ list: title, properties })
      return Promise.resolve({ Id: 100 + adds.length, ...properties })
    }
    const list: any = {
      items,
      select: () => list,
      rootFolder: () => Promise.resolve({ ServerRelativeUrl: `/sites/pp365/Lists/${title}` })
    }
    return list
  }
  const sp = {
    web: {
      lists: { getByTitle },
      siteGroups: {
        getByName: (name: string) => ({ users: () => Promise.resolve(groups[name] ?? []) })
      }
    }
  }
  return { sp, updates, adds }
}

/** A list view row stand-in (`RowAccessor`): values by internal name, and the list's fields. */
export function row(
  values: Record<string, any>,
  fields: { internalName: string; displayName?: string; fieldType?: string }[] = []
): any {
  return { getValueByName: (name: string) => values[name], fields }
}

/**
 * The SPFx context of a list view command set on the list `listTitle`, with `selectedRows`
 * selected. `changed` raises the list view's state changed event, as SPFx does when the selection
 * changes, and waits for the handlers.
 */
export function commandSetContext({
  listTitle,
  selectedRows = [] as any[],
  serverRelativeUrl = `/sites/pp365/Lists/${listTitle}`
}: {
  listTitle: string
  selectedRows?: any[]
  serverRelativeUrl?: string
}) {
  const handlers: (() => unknown)[] = []
  const context = {
    pageContext: {
      list: { title: listTitle, serverRelativeUrl },
      user: { email: USER },
      site: { absoluteUrl: HUB, id: { toString: () => 'site-1' } },
      web: { absoluteUrl: HUB }
    },
    listView: {
      selectedRows,
      listViewStateChangedEvent: {
        add: (_observer: unknown, handler: () => unknown) => handlers.push(handler)
      }
    }
  }
  const changed = async () => {
    for (const handler of handlers) await handler()
  }
  return { context, changed }
}

const CHOICES = JSON.stringify({
  approve: { choice: 'Godkjenn', recommendation: 'Godkjent' },
  consideration: { choice: 'Vurder', recommendation: 'Under vurdering' },
  reject: { choice: 'Avvis', recommendation: 'Avvist' },
  pilot: { choice: 'Prøv ut', recommendation: 'Pilot' }
})

/** An item of the idea configuration list, as `SPIdeaConfigurationItem` reads it. */
export function ideaConfiguration(overrides: Record<string, any> = {}) {
  return {
    Title: 'Standard',
    GtDescription: JSON.stringify({
      registration: 'Anbefal ideen.',
      processing: 'Behandle ideen.',
      projectData: 'Opprett prosjektdata for ideen.'
    }),
    GtIdeaProcessingList: PROCESSING_LIST,
    GtIdeaRegistrationList: REGISTRATION_LIST,
    GtIdeaProcessingChoices: CHOICES,
    GtIdeaRegistrationChoices: CHOICES,
    ...overrides
  }
}

/** The execute event of a command, with `rows` selected. */
export function execute(itemId: string, ...rows: any[]): any {
  return { itemId, selectedRows: rows }
}

/** Lets the promises a command starts without awaiting them run to their end. */
export function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * jsdom cannot navigate, and reports every reload or change of `location.href` as an error; the
 * command sets reload the page after each write. Swallows that report and nothing else. Restore
 * the returned spy after the test.
 */
export function ignoreNavigation(): jest.SpyInstance {
  // Every other error still reaches the test output.
  // eslint-disable-next-line no-console
  const consoleError = console.error
  return jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    if (String(args[0]?.message ?? args[0]).includes('Not implemented: navigation')) return
    consoleError(...args)
  })
}
