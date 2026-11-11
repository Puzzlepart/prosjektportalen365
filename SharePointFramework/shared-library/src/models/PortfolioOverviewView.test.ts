import { PortfolioOverviewView } from './PortfolioOverviewView'
import { ProjectColumn } from './ProjectColumn'

/**
 * How a view orders its columns: by its own saved column order when it has one, with a column
 * the order does not know — one added since it was saved — after the ordered ones by its own sort
 * order; and by the columns' sort order alone otherwise. A new column used to sort first, since
 * `indexOf` said -1.
 */
const column = (Id: number, GtSortOrder: number) =>
  new ProjectColumn({ Id, Title: `Kolonne ${Id}`, GtSortOrder, GtShowFieldPortfolio: true } as any)

const view = (GtPortfolioColumnOrder?: string) =>
  new PortfolioOverviewView({
    Id: 1,
    Title: 'Visning',
    GtPortfolioColumnsId: [1, 2, 3],
    GtPortfolioColumnOrder
  } as any)

describe('PortfolioOverviewView.configure', () => {
  it('orders the columns by their sort order when the view has no order of its own', () => {
    const configured = view().configure([column(1, 30), column(2, 10), column(3, 20)])
    expect(configured.columns.map((c) => c.id)).toEqual([2, 3, 1])
  })

  it("orders the columns by the view's own order when it has one", () => {
    const configured = view('[3,1,2]').configure([column(1, 10), column(2, 20), column(3, 30)])
    expect(configured.columns.map((c) => c.id)).toEqual([3, 1, 2])
  })

  it("puts a column the view's order does not know last, by its sort order", () => {
    const configured = view('[2,1]').configure([column(1, 10), column(2, 20), column(3, 5)])
    expect(configured.columns.map((c) => c.id)).toEqual([2, 1, 3])
  })
})
