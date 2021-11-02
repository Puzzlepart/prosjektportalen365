import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import * as strings from 'ProgramWebPartsStrings'
import { IProgramAdministrationProps } from 'components/ProgramAdministration/types'
import { BaseProgramWebPart } from 'webparts/baseProgramWebPart/baseProgramWebPart'
import { ProgramAdministration } from 'components/ProgramAdministration'
import { sp, SPRest } from '@pnp/sp'

export default class ProgramAdministrationWebPart extends BaseProgramWebPart<IProgramAdministrationProps> {
  private _sp: SPRest

  public async onInit(): Promise<void> {
    await super.onInit()
    sp.setup({ spfxContext: this.context })
    this._sp = sp.configure({}, this.context.pageContext.web.absoluteUrl)
  }

  public render(): void {
    this.renderComponent<IProgramAdministrationProps>(ProgramAdministration, {
      description: this.description,
      context: this.context,
      dataAdapter: this.dataAdapter,
      sp: this._sp
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
