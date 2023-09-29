/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  BaseFieldCustomizer,
  IFieldCustomizerCellEventParameters
} from '@microsoft/sp-listview-extensibility'
import { ReactElement, createElement } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { RiskAction } from './components/RiskAction'
import { IRiskActionProps } from './components/RiskAction/types'
import { DataAdapter } from './dataAdapter'
import {
  IRiskActionFieldCustomizerItemContext,
  IRiskActionFieldCustomizerProperties
} from './types'
import { RiskActionFieldCustomizerContext } from './context'

export default class RiskActionFieldCustomizer extends BaseFieldCustomizer<IRiskActionFieldCustomizerProperties> {
  dataAdapter: DataAdapter
  hiddenFieldValues: Map<string, any>

  public async onInit(): Promise<void> {
    await super.onInit()
    this.dataAdapter = new DataAdapter(this.context)
    await this.dataAdapter.ensureHiddenField()
    this.hiddenFieldValues = await this.dataAdapter.getHiddenFieldValues()
  }

  public onRenderCell(event: IFieldCustomizerCellEventParameters): void {
    const hiddenFieldValue = this.hiddenFieldValues.get(
      event.listItem.getValueByName('ID').toString()
    )
    const currentItemContext: IRiskActionFieldCustomizerItemContext = {
      id: event.listItem.getValueByName('ID'),
      title: event.listItem.getValueByName('Title'),
      url: `${window.location.protocol}//${window.location.host}${
        this.context.pageContext.list.serverRelativeUrl
      }/DispForm.aspx?ID=${event.listItem.getValueByName('ID')}`,
      fieldValue: event.fieldValue,
      hiddenFieldValue
    }

    const riskAction: ReactElement<IRiskActionProps> = createElement(RiskAction, {
      ...this.properties
    })

    const element = createElement(
      RiskActionFieldCustomizerContext.Provider,
      {
        value: {
          dataAdapter: this.dataAdapter,
          itemContext: currentItemContext
        }
      },
      riskAction
    )

    render(element, event.domElement)
  }

  public onDisposeCell(event: IFieldCustomizerCellEventParameters): void {
    unmountComponentAtNode(event.domElement)
    super.onDisposeCell(event)
  }
}
