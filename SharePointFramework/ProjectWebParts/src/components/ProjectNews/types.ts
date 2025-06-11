import { SPHttpClient } from '@microsoft/sp-http'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from 'pp365-shared-library/lib/components/BaseWebPartComponent'

export interface IProjectNewsProps extends IBaseWebPartComponentProps {
  /**
   * The URL of the SharePoint site where the news is located.
   * This is used to fetch news items and to create new news pages.
   * It should be in the format: https://yourtenant.sharepoint.com/sites/yoursite
   */
  siteUrl: string
  /**
   * SPHttpClient for making requests
   */
  spHttpClient: SPHttpClient
  /**
   * The maximum number of news items to display
   */
  maxVisibleNews?: number
  /**
   * The name of the folder where news items should be stored.
   * This is used to ensure the folder exists and to fetch news items from it.
   * If not provided, defaults to 'Project News'.
   */
  newsFolderName?: string
}

export interface IProjectNewsState extends IBaseWebPartComponentState<IProjectNewsData> {
  /**
   * Indicates whether the component is loading data.
   */
  loading?: boolean
  /**
   * Timestamp for refetch. Changing this state variable refetches the data in
   * `useProjectNewsDataFetch`.
   */
  refetch?: number
}

/**
 * The shape of a news item as returned from SharePoint REST API
 */
export interface SharePointNewsItem {
  /**
   * Title of the news item
   */
  Title: string
  /**
   * The title of the news item as it appears in the URL
   */
  FileLeafRef: string

  Editor?: { Title?: string }
  /**
   * The date when the news item was last modified
   */
  Modified?: string
  /**
   * URL to the banner image for the news item
   */
  BannerImageUrl?: string
  /**
   * The description of the news item
   */
  Description?: string
}

export interface IProjectNewsData {
  /**
   * news data set (placeholder, points to random model, create model if needed)
   */
  news?: SharePointNewsItem[]
}
