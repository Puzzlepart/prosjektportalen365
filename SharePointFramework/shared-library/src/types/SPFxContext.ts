import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import {
  FieldCustomizerContext,
  ListViewCommandSetContext
} from '@microsoft/sp-listview-extensibility'
import { WebPartContext } from '@microsoft/sp-webpart-base'

/**
 * Accepts the SPFx host contexts supported by shared clients and components.
 */
export type SPFxContext =
  ApplicationCustomizerContext | ListViewCommandSetContext | WebPartContext | FieldCustomizerContext
