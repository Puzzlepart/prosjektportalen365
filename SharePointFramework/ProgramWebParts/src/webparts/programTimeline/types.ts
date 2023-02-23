import { IBaseWebPartComponentProps } from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'

export interface IProgramTimelineWebPartProps extends IBaseWebPartComponentProps {
  title: string
  dataSourceName?: string
  configItemTitle?: string
}
