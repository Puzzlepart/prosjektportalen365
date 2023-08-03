import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import { WebPartContext } from '@microsoft/sp-webpart-base'

export type SPFxContext = ApplicationCustomizerContext | ListViewCommandSetContext | WebPartContext
