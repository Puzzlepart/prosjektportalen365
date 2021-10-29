import * as React from 'react'
import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import * as strings from 'ProgramWebPartsStrings'
import { IProgramAdministrationProps } from 'components/ProgramAdministration/types'
import { BaseProgramWebPart } from 'webparts/baseProgramWebPart/baseProgramWebPart'
import { DataAdapter } from 'data'
import { IBaseWebPartComponentProps } from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import { ProgramAdministration } from 'components/ProgramAdministration'

export default class TEST extends BaseProgramWebPart<IProgramAdministrationProps> {
  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProgramAdministrationProps>(ProgramAdministration, {
      description: this.description,
      context: this.context,
      dataAdapter: this.dataAdapter
    })
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement)
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0')
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.BenefitOwnerLabel
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: 'test'
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
