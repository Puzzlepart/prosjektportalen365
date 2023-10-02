/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  BaseFieldCustomizer,
  IFieldCustomizerCellEventParameters
} from '@microsoft/sp-listview-extensibility'
import { createElement } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { RiskAction } from './components/RiskAction'
import { RiskActionFieldCustomizerContext } from './context'
import { DataAdapter } from './dataAdapter'
import { RiskActionItemContext } from './types'

export default class RiskActionFieldCustomizer extends BaseFieldCustomizer<null> {
  protected _dataAdapter: DataAdapter
  protected _hiddenFieldValues: Map<string, any> = new Map<string, any>()

  public async onInit(): Promise<void> {
    await super.onInit()
    this._dataAdapter = new DataAdapter(this.context)
    await this._dataAdapter.configure(this.context, {})
    const globalSettings = await this._dataAdapter.portal.getGlobalSettings()
    if (globalSettings.get('RiskActionPlanner') === '1') {
      await this._dataAdapter.ensureHiddenFields()
      this._hiddenFieldValues = await this._dataAdapter.getHiddenFieldValues()
    }
  }

  /**
   * Renders the custom field cell for a risk action item.
   *
   * @param event - The event parameters for rendering the cell.
   *
   * @returns void
   */
  public onRenderCell(event: IFieldCustomizerCellEventParameters): void {
    const currentItemContext = RiskActionItemContext.create(event, this.context.pageContext, this._hiddenFieldValues)
    const riskAction = createElement(RiskAction)
    const element = createElement(
      RiskActionFieldCustomizerContext.Provider,
      {
        value: {
          dataAdapter: this._dataAdapter,
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
