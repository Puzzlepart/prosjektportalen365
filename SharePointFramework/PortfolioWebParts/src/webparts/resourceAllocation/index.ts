import { IPropertyPaneConfiguration, PropertyPaneDropdown } from '@microsoft/sp-property-pane'
import { IResourceAllocationProps, ResourceAllocation } from 'components/ResourceAllocation'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import strings from 'PortfolioWebPartsStrings'
import { format } from '@fluentui/react'

export default class ResourceAllocationWebPart extends BasePortfolioWebPart<IResourceAllocationProps> {
  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IResourceAllocationProps>(ResourceAllocation)
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const propertiesWithDefaults = { ...ResourceAllocation.defaultProps, ...this.properties }
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.ResourceAllocationGroupName,
              groupFields: [
                PropertyPaneDropdown('defaultTimeframeStart', {
                  label: strings.DefaultTimeframeStartLabel,
                  selectedKey: propertiesWithDefaults.defaultTimeframeStart,
                  options: [
                    [2, 'months'],
                    [4, 'months'],
                    [6, 'months'],
                    [8, 'months'],
                    [10, 'months'],
                    [12, 'months']
                  ].map((val) => ({
                    key: val.toString(),
                    text: format(strings.DefaultTimeframeStartValue, val[0])
                  }))
                }),
                PropertyPaneDropdown('defaultTimeframeEnd', {
                  label: strings.DefaultTimeframeEndLabel,
                  selectedKey: propertiesWithDefaults.defaultTimeframeEnd,
                  options: [
                    [2, 'months'],
                    [4, 'months'],
                    [6, 'months'],
                    [8, 'months'],
                    [10, 'months'],
                    [12, 'months']
                  ].map((val) => ({
                    key: val.toString(),
                    text: format(strings.DefaultTimeframeEndValue, val[0])
                  }))
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
