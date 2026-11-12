import { IProjectNewsData } from '../types'

/**
 * Recent news and the initial visible-article limit.
 */
export interface IRecentNewsProps extends IProjectNewsData {
  /**
   * The maximum number of news items to display initially.
   * If set, the component will show this many items before allowing the user to see more.
   */
  maxVisible?: number
}
