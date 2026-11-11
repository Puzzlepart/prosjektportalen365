// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The hub web, the term store and the Prosjekttillegg library are
// stand-ins set per test (`hub()`, `mockHub.termSets`, `mockHub.installed`).
const mockHub: { web: any; termSets: Record<string, string>; installed: any[] } = {
  web: undefined,
  termSets: {},
  installed: []
}
jest.mock('data/SPDataAdapter', () => ({
  __esModule: true,
  default: {
    get portalDataService() {
      return { web: mockHub.web }
    },
    sp: { web: {} }
  }
}))
jest.mock('pp365-shared-library', () => ({
  ...jest.requireActual('pp365-shared-library'),
  __esModule: true,
  getTermStore: () => ({
    sets: {
      getById: (id: string) => ({
        select: () => () =>
          id in mockHub.termSets
            ? Promise.resolve({ id, localizedNames: [{ name: mockHub.termSets[id] }] })
            : Promise.reject(new Error('Not found'))
      })
    }
  })
}))
jest.mock('./ProjectExtensionsService', () => ({
  ProjectExtensionsService: { getInstalledFiles: () => Promise.resolve(mockHub.installed) }
}))

import strings from 'PortfolioExtensionsStrings'
import { format } from 'pp365-shared-library'
import { ICompatibilityConflict } from 'models'
import { CompatibilityService } from './CompatibilityService'

/** A query stand-in: `select()` and `top()` chain, and a call answers with the rows. */
function rows(values: any[]) {
  const query: any = () => Promise.resolve(values)
  query.select = () => query
  query.top = () => query
  return query
}

/** The hub web: its site columns, content types and lists, each list with its fields and views. */
function hub({
  fields = [],
  contentTypes = [],
  lists = {}
}: {
  fields?: any[]
  contentTypes?: any[]
  lists?: Record<string, { fields?: any[]; views?: any[] }>
}) {
  mockHub.web = {
    fields: rows(fields),
    contentTypes: rows(contentTypes),
    lists: Object.assign(rows(Object.keys(lists).map((Title) => ({ Title }))), {
      getByTitle: (title: string) => ({
        fields: rows(lists[title]?.fields ?? []),
        views: rows(lists[title]?.views ?? [])
      })
    })
  }
}

/** The conflicts the check reports for a package's hub template. */
async function conflictsOf(schema: any): Promise<ICompatibilityConflict[]> {
  const report = await CompatibilityService.check(null, { id: 'pakke' } as any, undefined, {
    schema,
    includeExtensions: false
  })
  expect(report.hasConflicts).toBe(report.conflicts.length > 0)
  return report.conflicts
}

const ID = {
  phase: '{1ac1b8c4-7b5b-4c3e-9b3a-111111111111}',
  owner: '{2bd2c9d5-8c6c-4d4f-8c4b-222222222222}',
  notes: '{3ce3dae6-9d7d-4e5a-9d5c-333333333333}',
  other: '{4df4ebf7-ae8e-4f6b-ae6d-444444444444}'
}

describe('CompatibilityService, site columns as sp-js-provisioning 1.5.1 applies them', () => {
  it('reports nothing for a column the hub has as the package declares it, Mult read as the multi type', async () => {
    hub({
      fields: [
        {
          Id: '1ac1b8c4-7b5b-4c3e-9b3a-111111111111',
          InternalName: 'GtPhase',
          TypeAsString: 'Text'
        },
        {
          Id: '2bd2c9d5-8c6c-4d4f-8c4b-222222222222',
          InternalName: 'GtOwners',
          TypeAsString: 'LookupMulti'
        }
      ]
    })
    expect(
      await conflictsOf({
        SiteFields: [
          `<Field ID="${ID.phase}" Name="GtPhase" Type="Text" />`,
          // SharePoint reports a Lookup with Mult="TRUE" as LookupMulti: no type change.
          `<Field ID="${ID.owner}" Name="GtOwners" Type="Lookup" Mult="TRUE" List="Lists/Eiere" />`,
          `<Field ID="${ID.notes}" Name="GtNew" Type="Note" />`
        ]
      })
    ).toEqual([])
  })

  it('reports a widening as applied, and any other type change as a column left as it is', async () => {
    hub({
      fields: [
        { Id: ID.phase, InternalName: 'GtPhase', TypeAsString: 'Text' },
        { Id: ID.owner, InternalName: 'GtOwner', TypeAsString: 'User' },
        { Id: ID.notes, InternalName: 'GtNotes', TypeAsString: 'Note' }
      ]
    })
    const conflicts = await conflictsOf({
      SiteFields: [
        `<Field ID="${ID.phase}" Name="GtPhase" Type="Note" />`,
        `<Field ID="${ID.owner}" Name="GtOwner" Type="User" Mult="TRUE" />`,
        `<Field ID="${ID.notes}" Name="GtNotes" Type="Text" />`
      ]
    })
    expect(conflicts.map(({ resolution, detail }) => ({ resolution, detail }))).toEqual([
      {
        resolution: 'overwrite',
        detail: format(strings.CatalogConflictSiteFieldWidened, 'GtPhase', 'Text', 'Note')
      },
      {
        resolution: 'overwrite',
        detail: format(strings.CatalogConflictSiteFieldWidened, 'GtOwner', 'User', 'UserMulti')
      },
      // Note to Text would lose values: the engine warns and leaves the column alone.
      {
        resolution: 'skip',
        detail: format(strings.CatalogConflictSiteFieldType, 'GtNotes', 'Note', 'Text')
      }
    ])
  })

  it('reports a column under another id as updated with its id kept, unless its type keeps it as it is', async () => {
    hub({
      fields: [
        { Id: ID.other, InternalName: 'GtPhase', TypeAsString: 'Text' },
        { Id: ID.notes, InternalName: 'GtNotes', TypeAsString: 'Note' }
      ]
    })
    const conflicts = await conflictsOf({
      SiteFields: [
        `<Field ID="${ID.phase}" Name="GtPhase" Type="Text" />`,
        `<Field ID="${ID.owner}" Name="GtNotes" Type="Choice" />`
      ]
    })
    expect(conflicts).toEqual([
      {
        kind: 'siteField',
        targetId: ID.phase,
        targetName: 'GtPhase',
        existingName: 'GtPhase',
        resolution: 'overwrite',
        detail: format(strings.CatalogConflictSiteField, 'GtPhase')
      },
      {
        kind: 'siteField',
        targetId: ID.owner,
        targetName: 'GtNotes',
        existingName: 'Note',
        resolution: 'skip',
        detail: format(strings.CatalogConflictSiteFieldType, 'GtNotes', 'Note', 'Choice')
      }
    ])
  })

  it('reports an id another column has as not created, which no longer blocks it', async () => {
    hub({ fields: [{ Id: ID.phase, InternalName: 'GtOldPhase', TypeAsString: 'Text' }] })
    expect(
      await conflictsOf({ SiteFields: [`<Field ID="${ID.phase}" Name="GtPhase" Type="Text" />`] })
    ).toEqual([
      {
        kind: 'siteField',
        targetId: ID.phase,
        targetName: 'GtPhase',
        existingName: 'GtOldPhase',
        resolution: 'skip',
        detail: format(strings.CatalogConflictSiteFieldReused, 'GtPhase', 'GtOldPhase')
      }
    ])
  })
})

describe('CompatibilityService, lists as sp-js-provisioning 1.5.1 applies them', () => {
  it('no longer blocks the fields and field references a hub list has: they are updated in place', async () => {
    hub({
      lists: {
        Prosjekter: {
          fields: [
            { Id: ID.phase, InternalName: 'GtPhase', TypeAsString: 'Text' },
            { Id: ID.owner, InternalName: 'GtOwners', TypeAsString: 'UserMulti' }
          ]
        }
      }
    })
    expect(
      await conflictsOf({
        Lists: [
          {
            Title: 'Prosjekter',
            Fields: [
              `<Field ID="${ID.phase}" Name="GtPhase" DisplayName="Fase" Type="Text" />`,
              `<Field ID="${ID.owner}" Name="GtOwners" Type="User" Mult="TRUE" />`
            ],
            FieldRefs: [{ ID: ID.phase, Name: 'GtPhase', DisplayName: 'Fase' }]
          }
        ]
      })
    ).toEqual([])
  })

  it("reports a list field's type change as the engine acts, and a name the list has under another id", async () => {
    hub({
      lists: {
        Prosjekter: {
          fields: [
            { Id: ID.phase, InternalName: 'GtPhase', TypeAsString: 'Lookup' },
            { Id: ID.notes, InternalName: 'GtNotes', TypeAsString: 'Note' },
            { Id: ID.other, InternalName: 'GtOwner', TypeAsString: 'User' }
          ]
        }
      }
    })
    const conflicts = await conflictsOf({
      Lists: [
        {
          Title: 'Prosjekter',
          Fields: [
            `<Field ID="${ID.phase}" Name="GtPhase" Type="Lookup" Mult="TRUE" />`,
            `<Field ID="${ID.notes}" Name="GtNotes" Type="Text" />`,
            `<Field ID="${ID.owner}" Name="GtOwner" Type="User" />`
          ]
        }
      ]
    })
    expect(conflicts.map(({ kind, resolution, detail }) => ({ kind, resolution, detail }))).toEqual(
      [
        {
          kind: 'listField',
          resolution: 'overwrite',
          detail: format(
            strings.CatalogConflictListFieldWidened,
            'GtPhase',
            'Prosjekter',
            'Lookup',
            'LookupMulti'
          )
        },
        {
          kind: 'listField',
          resolution: 'skip',
          detail: format(
            strings.CatalogConflictListFieldType,
            'GtNotes',
            'Prosjekter',
            'Note',
            'Text'
          )
        },
        {
          kind: 'listField',
          resolution: 'skip',
          detail: format(strings.CatalogConflictListField, 'GtOwner', 'Prosjekter')
        }
      ]
    )
  })

  it('no longer promises to remove the content types of a hub list, and leaves out a list the hub lacks', async () => {
    hub({ lists: { Prosjekter: {} } })
    expect(
      await conflictsOf({
        Lists: [
          { Title: 'Prosjekter', RemoveExistingContentTypes: true },
          {
            Title: 'Ny liste',
            RemoveExistingContentTypes: true,
            Fields: [`<Field ID="${ID.phase}" Name="GtPhase" Type="Text" />`]
          }
        ]
      })
    ).toEqual([
      {
        kind: 'list',
        targetId: 'Prosjekter',
        targetName: 'Prosjekter',
        resolution: 'skip',
        detail: format(strings.CatalogConflictList, 'Prosjekter')
      }
    ])
  })

  it('still reports an existing view as overwritten', async () => {
    hub({ lists: { Prosjekter: { views: [{ Title: 'Alle elementer' }] } } })
    expect(
      await conflictsOf({
        Lists: [{ Title: 'Prosjekter', Views: [{ Title: 'Alle elementer' }, { Title: 'Ny' }] }]
      })
    ).toEqual([
      {
        kind: 'listView',
        targetId: 'Alle elementer',
        targetName: 'Alle elementer',
        existingName: 'Prosjekter',
        resolution: 'overwrite',
        detail: format(strings.CatalogConflictListView, 'Alle elementer', 'Prosjekter')
      }
    ])
  })
})

describe('CompatibilityService, content types', () => {
  it('skips a content type id owned by another, and blocks a field reference the hub lacks', async () => {
    hub({
      fields: [{ Id: ID.phase, InternalName: 'GtPhase', TypeAsString: 'Text' }],
      contentTypes: [{ StringId: '0x0100AB', Name: 'Prosjekt' }]
    })
    const conflicts = await conflictsOf({
      SiteFields: [`<Field ID="${ID.notes}" Name="GtNotes" Type="Note" />`],
      ContentTypes: [
        { ID: '0x0100ab', Name: 'Byggprosjekt', FieldRefs: [{ Name: 'GtPhase' }] },
        { ID: '0x0100CD', Name: 'Fase', FieldRefs: [{ Name: 'GtNotes' }, { Name: 'GtMissing' }] }
      ]
    })
    expect(conflicts.map(({ kind, resolution }) => ({ kind, resolution }))).toEqual([
      { kind: 'contentType', resolution: 'skip' },
      { kind: 'fieldRef', resolution: 'blocked' }
    ])
    expect(conflicts[1].detail).toBe(format(strings.CatalogConflictFieldRef, 'Fase', 'GtMissing'))
  })
})

describe('CompatibilityService.stripConflicts', () => {
  const schema = {
    SiteFields: [
      `<Field ID="${ID.phase}" Name="GtPhase" Type="Text" />`,
      `<Field ID="${ID.notes}" Name="GtNotes" Type="Text" />`
    ],
    ContentTypes: [
      { ID: '0x0100AB', Name: 'Byggprosjekt' },
      { ID: '0x0100CD', Name: 'Fase' },
      { ID: '0x0100EF', Name: 'Status' }
    ],
    Lists: [
      {
        Title: 'Prosjekter',
        Fields: [`<Field ID="${ID.owner}" Name="GtOwner" Type="User" />`],
        FieldRefs: [{ ID: ID.phase, Name: 'GtPhase' }]
      }
    ],
    Taxonomy: {
      TermSets: [
        { Id: ID.phase, Name: 'Fase' },
        { Id: ID.other, Name: 'Område' }
      ]
    }
  }
  const conflict = (kind: string, targetId: string, targetName: string, resolution: string) =>
    ({ kind, targetId, targetName, resolution, detail: '' }) as ICompatibilityConflict

  it('strips the content types and term sets, and leaves site columns and list fields to the engine', () => {
    const report = {
      hasConflicts: true,
      conflicts: [
        conflict('contentType', '0x0100ab', 'Byggprosjekt', 'skip'),
        conflict('fieldRef', 'GtMissing', 'Fase', 'blocked'),
        conflict('taxonomy', ID.other, 'Område', 'skip'),
        conflict('siteField', ID.phase, 'GtPhase', 'skip'),
        conflict('siteField', ID.notes, 'GtNotes', 'skip'),
        conflict('listField', ID.owner, 'GtOwner', 'skip'),
        conflict('list', 'Prosjekter', 'Prosjekter', 'skip')
      ]
    }
    const stripped = CompatibilityService.stripConflicts(schema, report)
    expect(stripped.ContentTypes).toEqual([{ ID: '0x0100EF', Name: 'Status' }])
    expect(stripped.Taxonomy).toEqual({ TermSets: [{ Id: ID.phase, Name: 'Fase' }] })
    expect(stripped.SiteFields).toBe(schema.SiteFields)
    expect(stripped.Lists).toBe(schema.Lists)
    // A shallow clone: the package's schema is left as it was.
    expect(schema.ContentTypes).toHaveLength(3)
  })

  it('drops Taxonomy when every term set is skipped, and returns a schema without conflicts as it is', () => {
    const report = {
      hasConflicts: true,
      conflicts: [
        conflict('taxonomy', ID.phase, 'Fase', 'skip'),
        conflict('taxonomy', ID.other, 'Område', 'skip')
      ]
    }
    expect(CompatibilityService.stripConflicts(schema, report).Taxonomy).toBeUndefined()
    expect(
      CompatibilityService.stripConflicts(schema, { hasConflicts: false, conflicts: [] })
    ).toBe(schema)
  })
})

describe('CompatibilityService, the term store, the extensions and the package', () => {
  beforeEach(() => {
    hub({})
    mockHub.termSets = {}
    mockHub.installed = []
  })

  it('skips a term set the term store has under another name, and checks none with the flag off', async () => {
    mockHub.termSets = { [ID.phase]: 'Prosjektfase', [ID.owner]: 'Område' }
    const schema = {
      Taxonomy: {
        TermSets: [
          { Id: ID.phase, Name: 'Fase' },
          { Id: ID.owner, Name: 'Område' },
          // Not in the term store: it is created.
          { Id: ID.notes, Name: 'Ny' }
        ]
      }
    }
    expect(await conflictsOf(schema)).toEqual([
      {
        kind: 'taxonomy',
        targetId: ID.phase,
        targetName: 'Fase',
        existingName: 'Prosjektfase',
        resolution: 'skip',
        detail: format(strings.CatalogConflictTaxonomy, 'Fase', 'Prosjektfase')
      }
    ])
    const report = await CompatibilityService.check(null, { id: 'pakke' } as any, false, {
      schema,
      includeExtensions: false
    })
    expect(report.conflicts).toEqual([])
  })

  it("reports an extension file another package or an admin put there, and not the package's own", async () => {
    mockHub.installed = [
      { fileName: 'FaseA.json', stamp: { id: 'PAKKE', version: '1.0.0' } },
      { fileName: 'FaseB.json', stamp: { id: 'annen-pakke', version: '2.0.0' } },
      { fileName: 'FaseC.json' }
    ]
    const manifest = {
      id: 'pakke',
      provisioning: {
        extensions: [
          { name: 'Fase A', file: 'extensions/FaseA.json' },
          { name: 'Fase B', file: 'extensions/FaseB.json' },
          { name: 'Fase C', file: 'FaseC.json' },
          { name: 'Fase D', file: 'extensions/FaseD.json' }
        ]
      }
    } as any
    const report = await CompatibilityService.check(null, manifest)
    expect(
      report.conflicts.map(({ targetId, existingName, resolution, detail }) => ({
        targetId,
        existingName,
        resolution,
        detail
      }))
    ).toEqual([
      {
        targetId: 'faseb.json',
        existingName: 'annen-pakke',
        resolution: 'overwrite',
        detail: format(strings.CatalogConflictExtension, 'Fase B')
      },
      {
        targetId: 'fasec.json',
        existingName: undefined,
        resolution: 'overwrite',
        detail: format(strings.CatalogConflictExtension, 'Fase C')
      }
    ])
  })

  it("reads the package's hub template, and reports nothing for one it lacks or cannot read", async () => {
    hub({ lists: { Prosjekter: {} } })
    const zip = (files: Record<string, string>) => ({
      file: (name: string) => (name in files ? { async: () => Promise.resolve(files[name]) } : null)
    })
    const manifest = { id: 'pakke', provisioning: { hubTemplate: 'hub-template.json' } } as any
    const template = JSON.stringify({
      Lists: [{ Title: 'Prosjekter', RemoveExistingContentTypes: true }]
    })
    expect(
      (await CompatibilityService.check(zip({ 'hub-template.json': template }), manifest)).conflicts
    ).toHaveLength(1)
    expect(
      (await CompatibilityService.check(zip({ 'hub-template.json': '{' }), manifest)).conflicts
    ).toEqual([])
    expect((await CompatibilityService.check(zip({}), manifest)).conflicts).toEqual([])
    expect((await CompatibilityService.check(zip({}), { id: 'pakke' } as any)).conflicts).toEqual(
      []
    )
  })

  it('returns what it found when a read fails, as a check that warns rather than stops', async () => {
    hub({ fields: [{ Id: ID.phase, InternalName: 'GtOldPhase', TypeAsString: 'Text' }] })
    mockHub.web.lists = Object.assign(() => Promise.reject(new Error('Ingen tilgang')), {
      select: () => () => Promise.reject(new Error('Ingen tilgang'))
    })
    const report = await CompatibilityService.check(null, { id: 'pakke' } as any, undefined, {
      schema: {
        SiteFields: [`<Field ID="${ID.phase}" Name="GtPhase" Type="Text" />`],
        Lists: [{ Title: 'Prosjekter', RemoveExistingContentTypes: true }]
      },
      includeExtensions: false
    })
    expect(report.conflicts.map((c) => c.kind)).toEqual(['siteField'])
    expect(report.hasConflicts).toBe(true)
  })
})
