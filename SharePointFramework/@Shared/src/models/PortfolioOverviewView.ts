/* eslint-disable max-classes-per-file */
import * as _ from 'underscore'
import { ProjectColumn } from './ProjectColumn'

export class SPPortfolioOverviewViewItem {
  public Id: number = 0
  public Title: string = ''
  public GtSortOrder: number = 0
  public GtSearchQuery: string = ''
  public GtPortfolioIsDefaultView: boolean = false
  public GtPortfolioFabricIcon: string = ''
  public GtPortfolioIsPersonalView: boolean = false
  public GtPortfolioColumnsId: number[] = []
  public GtPortfolioRefinersId: number[] = []
  public GtPortfolioGroupById: number = 0
}

export class PortfolioOverviewView {
  public id: string | number
  public title: string
  public sortOrder: number
  public searchQuery: string
  public isDefaultView: boolean
  public iconName: string
  public isPersonal: boolean
  public columns: ProjectColumn[]
  public refiners: ProjectColumn[]
  public groupBy?: ProjectColumn
  public scope?: string

  constructor(private _item?: SPPortfolioOverviewViewItem) {
    this.id = _item?.Id
    this.title = _item?.Title
    this.sortOrder = _item?.GtSortOrder
    this.searchQuery = _item?.GtSearchQuery
    this.isDefaultView = _item?.GtPortfolioIsDefaultView
    this.iconName = _item?.GtPortfolioFabricIcon
    this.isPersonal = _item?.GtPortfolioIsPersonalView
  }

  /**
   * Configure the view with columns.
   *
   * @param columns Columns to configure the view with
   */
  public configure(columns: ProjectColumn[] = []): PortfolioOverviewView {
    this.columns = this._item.GtPortfolioColumnsId.map((id) =>
      _.find(columns, (col) => col.id === id)
    ).sort((a, b) => a.sortOrder - b.sortOrder)
    this.refiners = this._item.GtPortfolioRefinersId.map((id) =>
      _.find(columns, (col) => col.id === id)
    ).sort((a, b) => a.sortOrder - b.sortOrder)
    this.groupBy = _.find(columns, (col) => col.id === this._item.GtPortfolioGroupById)
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
   * @param view View to configure from≤
   */
  public configureFrom(view: PortfolioOverviewView): PortfolioOverviewView {
    this.columns = view.columns
    this.refiners = view.refiners
    this.groupBy = view.groupBy
    this.scope = view.scope
    this.searchQuery = view.searchQuery
    return this
  }
}
