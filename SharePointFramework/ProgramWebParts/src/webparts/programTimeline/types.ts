import { IBaseWebPartComponentProps } from 'pp365-shared-library/lib'

/** Program timeline title, delivery data source and timeline configuration title. */
export interface IProgramTimelineWebPartProps extends IBaseWebPartComponentProps {
  title: string
  dataSourceName?: string
  configItemTitle?: string
}
