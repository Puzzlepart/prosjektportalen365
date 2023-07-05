import { WebPartContext } from '@microsoft/sp-webpart-base'

export interface ITitleColumnProps {
  item: Record<string, any>
  renderProjectInformationPanel?: boolean
  webPartContext?: WebPartContext
}
