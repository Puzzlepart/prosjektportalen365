import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPDataAdapter } from 'data'
import { IBaseWebPartComponentProps } from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'

export interface IProgramTimelineWebPartProps extends IBaseWebPartComponentProps {
  description: string
  context: WebPartContext
  dataAdapter: SPDataAdapter
  childProjects: string[]
  infoText?: string
  title: string
  dataSourceName?: string
  configItemTitle?: string
}
