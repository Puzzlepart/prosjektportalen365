import { Version } from '@microsoft/sp-core-library'
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { PortfolioAggregation } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import * as strings from 'ProgramWebPartsStrings'
import React from 'react'
import * as ReactDom from 'react-dom'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IProgramDeliveriesWebPartProps } from './types'

export default class ProgramDeliveriesWebPart extends BaseProgramWebPart<IProgramDeliveriesWebPartProps> {
  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    ReactDom.render((
      <>
        <PortfolioAggregation
          title={this.pageTitle ?? this.properties.title}
          pageContext={this.context.pageContext}
          dataAdapter={this.dataAdapter}
          showCommandBar={this.properties.showCommandBar}
          showSearchBox={this.properties.showSearchBox}
          showExcelExportButton={this.properties.showExcelExportButton}
          lockedColumns={false}
          displayMode={this.properties.displayMode}
          onUpdateProperty={this._onUpdateProperty}
          dataSource={this.properties.dataSource}
          columns={this.properties.columns}
          isParent={true}
        />
      </>
    ), this.domElement)
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement)
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0')
  }

  private _onUpdateProperty(key: string, value: any) {
    this.properties[key] = value
    this.context.propertyPane.refresh()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupFields: [
                PropertyPaneTextField('webPartTitle', {
                  label: strings.WebPartTitleLabel,
                  value: strings.DeliveriesTitle
                }),
                PropertyPaneTextField('dataSource', {
                  label: strings.DataSourceLabel,
                  value: strings.DeliveriesDatasource
                }),
                PropertyPaneToggle('showCommandBar', {
                  label: strings.ShowCommandBarLabel,
                  checked: true
                }),
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel,
                  checked: true
                }),
                PropertyPaneToggle('showExcelExportButton', {
                  label: strings.ShowExcelExportButtonLabel,
                  checked: true
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
