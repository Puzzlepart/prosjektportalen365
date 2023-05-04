import { IMessageBarProps, MessageBar } from '@fluentui/react/lib/MessageBar'
import {
  IPropertyPaneConfiguration
} from '@microsoft/sp-property-pane'
import * as strings from 'PortfolioWebPartsStrings'
import { IPortfolioAggregationProps, PortfolioAggregation } from 'components/PortfolioAggregation'
import { DataAdapter } from 'data'
import { IAggregatedListConfiguration } from 'interfaces'
import React from 'react'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'
import { getPropertyPaneConfiguration } from './getPropertyPaneConfiguration'

export default class PortfolioAggregationWebPart extends BasePortfolioWebPart<
  IPortfolioAggregationProps
> {
  private _configuration: IAggregatedListConfiguration

  public render(): void {
    if (!this.properties.dataSource) {
      this.renderComponent<IMessageBarProps>(MessageBar, {
        children: <span>{strings.PortfolioAggregationNotConfiguredMessage}</span>
      })
    } else {
      this.renderComponent<IPortfolioAggregationProps>(PortfolioAggregation, {
        ...this.properties,
        dataAdapter: new DataAdapter(this.context),
        configuration: this._configuration,
        onUpdateProperty: this._onUpdateProperty.bind(this)
      })
    }
  }

  /**
   * On update property
   *
   * @param key Key
   * @param value Value
   */
  private _onUpdateProperty(key: string, value: any) {
    this.properties[key] = value
    this.context.propertyPane.refresh()
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this.dataAdapter.getAggregatedListConfig(
      this.properties.dataSourceCategory,
      this.properties.dataSourceLevel
    )
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
  return getPropertyPaneConfiguration(this._configuration, this.properties)
  }
}
