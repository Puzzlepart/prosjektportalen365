import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { IProgramAggregationProps, ProgramAggregation } from 'components/ProgramAggregation'
import { DataAdapter } from 'data'
import { IMessageBarProps, MessageBar } from 'office-ui-fabric-react/lib/MessageBar'
import strings from 'ProgramWebPartsStrings'
import React from 'react'
import { BaseProgramWebPart } from 'webparts/baseProgramWebPart'

export default class ProgramAggregationWebPart extends BaseProgramWebPart<IProgramAggregationProps> {
  public render(): void {
    if (!this.properties.dataSource) {
      this.renderComponent<IMessageBarProps>(MessageBar, {
        children: <span></span>
      })
    } else {
      this.renderComponent<IProgramAggregationProps>(ProgramAggregation, {
        ...this.properties,
        dataAdapter: new DataAdapter(this.context, this.hubSite, this.childProjects),
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
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.CommandBarGroupName,
              groupFields: [
                PropertyPaneToggle('showCommandBar', {
                  label: strings.ShowCommandBarLabel
                })
              ]
            },
            {
              groupName: strings.SearchBoxGroupName,
              groupFields: [
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel
                }),
                PropertyPaneTextField('searchBoxPlaceholderText', {
                  label: strings.SearchBoxPlaceholderTextLabel,
                  disabled: !this.properties.showSearchBox
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
