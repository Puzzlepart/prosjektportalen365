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
   * Configure the view from another view, overriding properties.
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
