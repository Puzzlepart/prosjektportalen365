import { IBaseWebPartComponentProps } from 'pp365-shared-library/lib'

export interface IProgramTimelineWebPartProps extends IBaseWebPartComponentProps {
  title: string
  dataSourceName?: string
  configItemTitle?: string
}
