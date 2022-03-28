import { Version } from '@microsoft/sp-core-library'
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import { sp, SPRest } from '@pnp/sp'
import { ProgramAdministration } from 'components/ProgramAdministration'
import { IProgramAdministrationProps } from 'components/ProgramAdministration/types'
import * as ReactDom from 'react-dom'
import { BaseProgramWebPart } from 'webparts/baseProgramWebPart/baseProgramWebPart'

export default class ProgramAdministrationWebPart extends BaseProgramWebPart<IProgramAdministrationProps> {
  private _sp: SPRest

  public async onInit(): Promise<void> {
    await super.onInit()
    sp.setup({ spfxContext: this.context })
    this._sp = sp.configure({}, this.context.pageContext.web.absoluteUrl)
  }

  public render(): void {
    this.renderComponent<IProgramAdministrationProps>(ProgramAdministration, {
      webPartTitle: this.properties.webPartTitle,
      description: this.description,
      context: this.context,
      dataAdapter: this.dataAdapter,
      sp: this._sp,
      title: this.properties.title
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
          groups: [
            {
              groupFields: [
                PropertyPaneTextField('webPartTitle', {
                  label: 'Tittel'
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
