/* eslint-disable max-classes-per-file */
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

  /**
   * Title of the view.
   */
  public title: string

  /**
   * Sort order for the view. This property is set when the view is
   * configured with a sort order.
   */
  public sortOrder: number

  /**
   * Search query for the view. This property is set when the view is
   * configured with a search query.
   */
  public searchQuery: string

  /**
   * Array of search queries for the view. This properties is set in
   * special cases where the query text is too long to fit in the
   * `searchQuery` property.
   */
  public searchQueries: string[]

  /**
   * `true` if the view is the default view, `false` otherwise.
   */
  public isDefaultView: boolean

  /**
   * Icon name for the view.
   */
  public iconName?: string

  /**
   * `true` if the view is a personal view, `false` otherwise.
   */
  public isPersonal: boolean

  /**
   * Columns for the view.
   */
  public columns: ProjectColumn[]

  /**
   * Refiners for the view.
   */
  public refiners: ProjectColumn[]

  /**
   * Column to group by.
   */
  public groupBy?: ProjectColumn

  /**
   * Scope of the view (not sure of the current usage of this property).
   */
  public scope?: string

  /**
   * Custom column order for the view.
   */
  public columnOrder: number[]

  /**
   * Column IDs for the view.
   */
  public columnIds: number[]

  /**
   * Refiner IDs for the view.
   */
  public refinerIds: number[]

  /**
   * Group by ID for the view.
   */
  public groupById: number

  /**
   * Author of the view.
   */
  public author: string

  /**
   * The view properties as a map. Used in the `PortfolioOverview`
   * component to edit and create views.
   */
  public $map: Map<string, any>

  public data: Record<string, any> = {}

  /**
   * Constructor for the `PortfolioOverviewView` class.
   *
   * @param item SP list item to create the view from
   */
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
   * @param title Title of the view
   * @param view View to create the default view from
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
    this.iconName = 'LocationCircle'
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
   * @param columns Columns to configure the view with
   */
  public configure(columns: ProjectColumn[] = []): PortfolioOverviewView {
    this.columns = this.columnIds.map((id) => _.find(columns, (col) => col.id === id))
    if (!_.isEmpty(this.columnOrder)) {
      this.columns = this.columns.sort(
        (a, b) => this.columnOrder.indexOf(a.id) - this.columnOrder.indexOf(b.id)
      )
    } else {
      this.columns = this.columns.sort((a, b) => a.sortOrder - b.sortOrder)
    }
    this.refiners = this.refinerIds
      .map((id) => _.find(columns, (col) => col.id === id))
      .sort((a, b) => a.sortOrder - b.sortOrder)
    this.groupBy = _.find(columns, (col) => col.id === this.groupById)
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
   *
   * @param queryText Query text to append to the view's search query
   */
  public appendToQuery(queryText: string): PortfolioOverviewView {
    this.searchQuery = `${this.searchQuery} ${queryText}`
    return this
  }

  /**
   * Configure the view from another view (copies the columns, refiners,
   * groupBy, scope and searchQuery properties).
   *
   * @param view View to configure from
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
