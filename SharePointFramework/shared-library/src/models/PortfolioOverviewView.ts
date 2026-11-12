import * as _ from 'underscore'
import { ProjectColumn } from './ProjectColumn'
import { tryParseJson } from '../util/tryParseJson'

/**
 * Represents an item in a SharePoint portfolio overview views
 * list. This is the list that contains the views that are available
 * for the portfolio overview.
 */
export class SPPortfolioOverviewViewItem {
  public Id?: number = 0
  public Title: string = ''
  public GtSearchQuery: string = ''
  public GtSortOrder?: number = 0
  public GtPortfolioIsDefaultView?: boolean = false
  public GtPortfolioFabricIcon?: string = ''
  public GtPortfolioIsPersonalView?: boolean = false
  public GtPortfolioColumnsId?: number[] | { results: number[] } = []
  public GtPortfolioRefinersId?: number[] | { results: number[] } = []
  public GtPortfolioGroupById?: number = 0
  public GtPortfolioColumnOrder?: string = ''
  public Author?: { EMail: string }
}

/**
 * Represents a portfolio overview view.
 */
export class PortfolioOverviewView {
  /**
   * ID of the view. This can be a string or a number. If it's a
   * number it's typically the SharePoint list item ID.
   */
  public id: string | number

  public title: string

  public sortOrder: number

  public searchQuery: string

  /**
   * Array of search queries for the view. This properties is set in
   * special cases where the query text is too long to fit in the
   * `searchQuery` property.
   */
  public searchQueries: string[]

  public isDefaultView: boolean

  public iconName?: string

  public isPersonal: boolean

  public columns: ProjectColumn[]

  public refiners: ProjectColumn[]

  public groupBy?: ProjectColumn

  public scope?: string

  public columnOrder: number[]

  public columnIds: number[]

  public refinerIds: number[]

  public groupById: number

  public author: string

  /**
   * The view properties as a map. Used in the `PortfolioOverview`
   * component to edit and create views.
   */
  public $map: Map<string, any>

  public data: Record<string, any> = {}

  constructor(item?: SPPortfolioOverviewViewItem) {
    this.id = item?.Id
    this.title = item?.Title
    this.sortOrder = item?.GtSortOrder
    this.searchQuery = item?.GtSearchQuery
    this.isDefaultView = item?.GtPortfolioIsDefaultView
    this.iconName = item?.GtPortfolioFabricIcon
    this.isPersonal = item?.GtPortfolioIsPersonalView
    this.columnOrder = tryParseJson<number[]>(item?.GtPortfolioColumnOrder, [])
    this.columnIds = (item?.GtPortfolioColumnsId as number[]) ?? []
    this.refinerIds = (item?.GtPortfolioRefinersId as number[]) ?? []
    this.groupById = item?.GtPortfolioGroupById
    this.author = item?.Author?.EMail
    this.$map = this._toMap()
  }

  /**
   * Create a default view. The search query will be based on the
   * specified view if provided. Otherwise it will be an empty string.
   *
   * @param sortOrder Sort order for the view if no view is provided
   * @param isPersonal `true` if the view is a personal view, `false` otherwise (default is `true`)
   */
  public createDefault(
    title: string,
    view?: PortfolioOverviewView,
    sortOrder?: number,
    isPersonal: boolean = true
  ): PortfolioOverviewView {
    this.title = title
    this.sortOrder = view ? view.sortOrder + 1 : sortOrder
    this.searchQuery = view?.searchQuery ?? ''
    this.iconName = 'Location'
    this.isDefaultView = false
    this.isPersonal = isPersonal
    this.$map = this._toMap()
    return this
  }

  /**
   * Returns `true` if the view is a program view, `false` otherwise.
   */
  public get isProgramView(): boolean {
    return typeof this.id === 'string'
  }

  /**
   * Configure the view with columns. If `columnOrder` is set, the columns
   * will be sorted according to the order in the `columnOrder` array. Otherwise
   * the columns will be sorted according to the `sortOrder` property on the
   * columns.
   *
   * Filters out columns that are not configured to be visible in Portfolio
   * (GtShowFieldPortfolio = false) even if they are in the view's columnIds.
   */
  public configure(columns: ProjectColumn[] = []): PortfolioOverviewView {
    this.columns = this.columnIds
      .map((id) => _.find(columns, (col) => col.id === id))
      .filter((col) => col && col.isVisible('Portfolio'))
    if (!_.isEmpty(this.columnOrder)) {
      // A column the order does not know — one added since the order was saved — goes after the
      // ordered ones, by its own sort order, rather than first as `indexOf`'s -1 would put it.
      const position = (column: ProjectColumn) => {
        const index = this.columnOrder.indexOf(column.id)
        return index === -1 ? Number.MAX_SAFE_INTEGER : index
      }
      this.columns = this.columns.sort(
        (a, b) => position(a) - position(b) || a.sortOrder - b.sortOrder
      )
    } else {
      this.columns = this.columns.sort((a, b) => a.sortOrder - b.sortOrder)
    }
    this.refiners = this.refinerIds
      .map((id) => _.find(columns, (col) => col.id === id))
      .filter((col) => col && col.isVisible('Portfolio'))
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const groupByColumn = _.find(columns, (col) => col.id === this.groupById)
    this.groupBy = groupByColumn?.isVisible('Portfolio') ? groupByColumn : undefined
    return this
  }

  /**
   * Set properties on the view (id, title, iconName) and returns the updated
   * properties.
   *
   * @param properties Properties to set on the view (id, title, iconName)
   */
  public set(
    properties: Pick<PortfolioOverviewView, 'id' | 'title' | 'iconName'>
  ): PortfolioOverviewView {
    this.id = properties.id ?? this.id
    this.title = properties.title ?? this.title
    this.iconName = properties.iconName ?? this.iconName
    return this
  }

  /**
   * Append the specified `queryText` to the view's search query. Returns
   * the view with the updated search query.
   */
  public appendToQuery(queryText: string): PortfolioOverviewView {
    this.searchQuery = `${this.searchQuery} ${queryText}`
    return this
  }

  /**
   * Configure the view from another view (copies the columns, refiners,
   * groupBy, scope and searchQuery properties).
   */
  public configureFrom(view: PortfolioOverviewView): PortfolioOverviewView {
    this.columns = view.columns
    this.refiners = view.refiners
    this.groupBy = view.groupBy
    this.scope = view.scope
    this.searchQuery = view.searchQuery
    this.columnOrder = view.columnOrder
    return this
  }

  /**
   * Converts the view to a map used in `ColumnFormPanel`.
   *
   * @private
   */
  private _toMap(): Map<string, any> {
    return new Map<string, any>([
      ['id', this.id],
      ['title', this.title],
      ['sortOrder', this.sortOrder],
      ['searchQuery', this.searchQuery],
      ['iconName', this.iconName],
      ['isDefaultView', this.isDefaultView],
      ['isPersonalView', this.isPersonal]
    ])
  }
}
