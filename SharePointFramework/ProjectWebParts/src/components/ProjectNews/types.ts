import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from 'pp365-shared-library/lib/components/BaseWebPartComponent'

export interface IProjectNewsProps extends IBaseWebPartComponentProps {
  /**
   * Christopher prop (placeholder)
   */
  christopherProp?: string
}

export interface IProjectNewsState extends IBaseWebPartComponentState<IProjectNewsData> {
  /**
   * Some state (placeholder)
   */
  loading?: boolean

  /**
   * Timestamp for refetch. Changing this state variable refetches the data in
   * `useProjectNewsDataFetch`.
   */
  refetch?: number
}

export interface IProjectNewsData {
  /**
   * news data set (placeholder, points to random model, create model if needed)
   */
  news?: []
}
