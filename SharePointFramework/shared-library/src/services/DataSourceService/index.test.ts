import resource from 'SharedResources'
import { DataSource, ProjectContentColumn } from '../../models'
import { DataSourceService } from './index'

/**
 * The data sources the matrices, the aggregated overviews and the dynamic list look up, read
 * from the hub's `Datakilder` list with the hub's content columns: a structural stand-in for the
 * PnPjs web, as `pnpShapes.ts` does, recording the lists, selects and filters asked for.
 */
const DATA_SOURCES = [
  {
    Id: 1,
    Title: 'Risikoer',
    GtDataSourceId: 'e0b1f6b9-6a52-4a06-9a0c-0c9a2bd1d5d1',
    GtDataSourceCategory: 'Risiko',
    GtDataSourceLevel: ['Prosjekt'],
    GtSearchQuery: 'ContentTypeId:0x0100* path:{SiteUrl}',
    GtProjectContentColumnsId: [10, 11],
    GtProjectContentRefinersId: [11],
    GtProjectContentGroupById: 10
  },
  {
    Id: 2,
    Title: 'Muligheter',
    GtDataSourceId: '3a0c1e1c-2b4d-4c6e-8f90-1a2b3c4d5e6f',
    GtDataSourceCategory: 'Mulighet',
    GtDataSourceLevel: ['Program'],
    GtSearchQuery: 'ContentTypeId:0x0100* path:{SiteUrl}',
    GtProjectContentColumnsId: [10],
    GtProjectContentRefinersId: [],
    GtProjectContentGroupById: null
  }
]
const COLUMNS = [
  { Id: 10, Title: 'Tittel', GtManagedProperty: 'Title', GtFieldDataType: 'Text' },
  { Id: 11, Title: 'Sannsynlighet', GtManagedProperty: 'GtRiskProbabilityOWSNMBR' },
  { Id: 12, Title: 'Konsekvens', GtManagedProperty: 'GtRiskConsequenceOWSNMBR' }
]

interface Asked {
  lists: string[]
  selects: string[][]
  filters: string[]
}

/** A web whose lists answer from the rows above, or fail when asked to. */
function fakeWeb(fail = false): { web: any; asked: Asked } {
  const asked: Asked = { lists: [], selects: [], filters: [] }
  const rows = (title: string) =>
    title === resource.Lists_DataSources_Title ? DATA_SOURCES : COLUMNS
  const items = (title: string) => {
    const query: any = () =>
      fail ? Promise.reject(new Error('503')) : Promise.resolve(rows(title))
    query.select = (...fields: string[]) => {
      asked.selects.push(fields)
      return query
    }
    query.filter = (filter: string) => {
      asked.filters.push(filter)
      return query
    }
    query.top = () => query
    return query
  }
  const web = {
    lists: {
      getByTitle: (title: string) => {
        asked.lists.push(title)
        return { items: items(title) }
      }
    }
  }
  return { web, asked }
}

describe('DataSourceService', () => {
  it("reads the hub's data sources and content columns lists by their titles in the strings", () => {
    const { web, asked } = fakeWeb()
    new DataSourceService(web)
    expect(asked.lists).toEqual([
      resource.Lists_DataSources_Title,
      resource.Lists_ProjectContentColumns_Title
    ])
  })

  it('finds a data source by its id, with its columns, refiners and grouping among the content columns', async () => {
    const { web, asked } = fakeWeb()
    const source = await new DataSourceService(web).getById(DATA_SOURCES[0].GtDataSourceId)
    expect(asked.filters).toEqual([`GtDataSourceId eq '${DATA_SOURCES[0].GtDataSourceId}'`])
    expect(asked.selects[0]).toEqual(expect.arrayContaining(['Id', 'Title', 'GtDataSourceId']))
    expect(source).toBeInstanceOf(DataSource)
    expect(source).toMatchObject({
      id: 1,
      title: 'Risikoer',
      category: 'Risiko',
      level: ['Prosjekt']
    })
    expect(source.columns.map((column) => column.id)).toEqual([10, 11])
    expect(source.refiners.map((column) => column.id)).toEqual([11])
    expect(source.groupBy).toBeInstanceOf(ProjectContentColumn)
    expect(source.groupBy.id).toBe(10)
  })

  it('finds a data source by its title', async () => {
    const { web, asked } = fakeWeb()
    const source = await new DataSourceService(web).getByName('Risikoer')
    expect(asked.filters).toEqual(["Title eq 'Risikoer'"])
    expect(source.title).toBe('Risikoer')
  })

  it('has nothing when no data source matches, and when the fetch fails, which it only logs', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      const { web: emptyWeb } = fakeWeb()
      emptyWeb.lists.getByTitle = () => ({
        items: Object.assign(() => Promise.resolve([]), {
          select: () => emptyWeb.lists.getByTitle().items,
          filter: () => emptyWeb.lists.getByTitle().items,
          top: () => emptyWeb.lists.getByTitle().items
        })
      })
      expect(await new DataSourceService(emptyWeb).getByName('Finnes ikke')).toBeNull()
      expect(warn).not.toHaveBeenCalled()
      const { web } = fakeWeb(true)
      expect(await new DataSourceService(web).getById('any')).toBeNull()
      expect(warn).toHaveBeenCalledTimes(1)
    } finally {
      warn.mockRestore()
    }
  })

  it('lists the data sources of a category, and of a level in it, configured with the columns given', async () => {
    const { web, asked } = fakeWeb()
    const columns = COLUMNS.map((column) => new ProjectContentColumn(column as any))
    const service = new DataSourceService(web)
    const risks = await service.getByCategory('Risiko', 'Prosjekt', columns)
    expect(asked.filters).toEqual([
      "GtDataSourceCategory eq 'Risiko' and GtDataSourceLevel eq 'Prosjekt'"
    ])
    // The stand-in does not filter, so both rows come back: the shape is what is checked.
    expect(risks).toHaveLength(2)
    expect(risks[0].columns.map((column) => column.id)).toEqual([10, 11])
    expect(risks[1].columns.map((column) => column.id)).toEqual([10])
    await service.getByCategory('Mulighet')
    expect(asked.filters[1]).toBe("GtDataSourceCategory eq 'Mulighet'")
  })
})
