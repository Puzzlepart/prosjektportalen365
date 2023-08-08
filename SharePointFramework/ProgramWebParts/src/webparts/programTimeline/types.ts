import { IBaseWebPartComponentProps } from 'pp365-shared-library/src/components/BaseWebPartComponent/types'

export interface IProgramTimelineWebPartProps extends IBaseWebPartComponentProps {
  title: string
  dataSourceName?: string
  configItemTitle?: string
}
