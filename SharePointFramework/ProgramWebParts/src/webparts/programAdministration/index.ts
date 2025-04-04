import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { ProgramAdministration } from 'components/ProgramAdministration/ProgramAdministration'
import { IProgramAdministrationProps } from 'components/ProgramAdministration/types'
import { unmountComponentAtNode } from 'react-dom'
import { BaseProgramWebPart } from '../baseProgramWebPart'

export default class ProgramAdministrationWebPart extends BaseProgramWebPart<IProgramAdministrationProps> {
  public render(): void {
    this.renderComponent<IProgramAdministrationProps>(ProgramAdministration, {
      context: this.context,
      dataAdapter: this._dataAdapter
    })
  }

  protected onDispose(): void {
    unmountComponentAtNode(this.domElement)
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }
}
