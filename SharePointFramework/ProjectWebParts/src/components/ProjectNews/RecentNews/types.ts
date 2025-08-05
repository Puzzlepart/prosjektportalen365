import { IProjectNewsData } from '../types'

/**
 * Props for the RecentNews component, which displays a list of recent news items.
 * It extends the IProjectNewsData interface to include news data.
 * The maxVisible prop controls how many news items are displayed initially.
 */
export interface IRecentNewsProps extends IProjectNewsData {
  /**
   * The maximum number of news items to display initially.
   * If set, the component will show this many items before allowing the user to see more.
   */
  maxVisible?: number
}
