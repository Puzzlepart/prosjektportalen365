import {
  BaseFieldCustomizer,
  IFieldCustomizerCellEventParameters
} from '@microsoft/sp-listview-extensibility'
import { createElement } from 'react'
import { RiskAction } from '../../components/RiskAction'
import { RiskActionFieldCustomizerContext } from './context'
import { DataAdapter } from './dataAdapter'
import { RiskActionItemContext } from './types'
import { renderReact, unmountReact } from 'pp365-shared-library'
import {
  attachTelemetryPortal,
  registerSiteTypeResolver,
  startTelemetry,
  telemetryInitFromContext,
  TelemetryProvider
} from 'pp365-shared-library/lib/telemetry'

/** Replaces risk-action cells with Planner controls when enabled in global settings. */
export default class RiskActionFieldCustomizer extends BaseFieldCustomizer<null> {
  protected _dataAdapter: DataAdapter
  protected _hiddenFieldValues: Map<string, any> = new Map<string, any>()
  protected _isPlannerEnabled = false

  public async onInit(): Promise<void> {
    await super.onInit()
    this._dataAdapter = new DataAdapter(this.context)
    await this._dataAdapter.configure(this.context, { loadGlobalSettings: true })
    this._startTelemetry()
    await this._initializePlannerContext()
  }

  /**
   * Starts usage statistics for the field, once the data adapter is configured: the page it is on,
   * the hub's settings the adapter has read, and how to tell what kind of site this is. It runs
   * once per list view, here and never in `onRenderCell`, which runs for every row and again each
   * time a row is drawn anew. The field is set up by now, and usage statistics must not undo that:
   * whatever goes wrong here is dropped.
   */
  private _startTelemetry(): void {
    try {
      const siteId = this.context.pageContext.site.id.toString()
      startTelemetry(telemetryInitFromContext(this.context, { isDebug: DEBUG }))
      attachTelemetryPortal(this._dataAdapter.portalDataService, this._dataAdapter.globalSettings)
      registerSiteTypeResolver(siteId, () =>
        this._dataAdapter.portalDataService.getSiteKind(siteId)
      )
    } catch {
      // Usage statistics never break the field.
    }
  }

  /**
   * Initializes the planner context if `RiskActionPlannerEnabled` is set to 1 in global settings
   * list. Ensures hidden fields and retrieves their values using the data adapter.
   */
  protected async _initializePlannerContext(): Promise<void> {
    this._isPlannerEnabled =
      this._dataAdapter.globalSettings.get('RiskActionPlannerEnabled') === '1'
    if (this._isPlannerEnabled) {
      await this._dataAdapter.ensureHiddenFields()
      this._hiddenFieldValues = await this._dataAdapter.getHiddenFieldValues()
    }
  }

  /**
   * Renders a risk cell with its stored task references when Planner integration is enabled.
   * Each cell is a React root of its own, so each gets the field's alias for usage statistics:
   * what its panel and dialogs count, they count for the field.
   */
  public onRenderCell(event: IFieldCustomizerCellEventParameters): void {
    if (!this._isPlannerEnabled) return
    const currentItemContext = RiskActionItemContext.create(
      event,
      this.context.pageContext,
      this._hiddenFieldValues
    )
    const riskAction = createElement(RiskAction)
    const element = createElement(
      TelemetryProvider,
      { component: 'RiskActionPlanner' },
      createElement(
        RiskActionFieldCustomizerContext.Provider,
        {
          value: {
            dataAdapter: this._dataAdapter,
            itemContext: currentItemContext
          }
        },
        riskAction
      )
    )
    renderReact(element, event.domElement)
  }

  public onDisposeCell(event: IFieldCustomizerCellEventParameters): void {
    unmountReact(event.domElement)
    super.onDisposeCell(event)
  }
}
