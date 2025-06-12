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
// export interface SharePointNewsItem {
//   /**
//    * Title of the news item
//    */
//   Title: string
//   /**
//    * The file name of the news item, as it appears in the Site Pages library and in the page URL.
//    * Example: "My-News-Article.aspx"
//    */
//   FileLeafRef: string
//   /**
//    * The user who last modified the news item.
//    * Contains the display name of the editor.
//    */
//   Editor?: { Title?: string }
//   /**
//    * The date when the news item was last modified
//    */
//   Modified?: string
//   /**
//    * URL to the banner image for the news item
//    */
//   BannerImageUrl?: string
//   /**
//    * The description of the news item
//    */
//   Description?: string
// }
export interface NewsItem {
  /**
   * Display name/title for the news card
   */
  name: string
  /**
   * Absolute URL to the news page
   */
  url: string
  /**
   * Display name of the author/editor
   */
  authorName?: string
  /**
   * Last modified date/time
   */
  modifiedDate?: string
  /**
   * Banner image URL (optional)
   */
  imageUrl?: string
  /**
   * Description (optional)
   */
  description?: string
}
export interface IProjectNewsData {
  /**
   * news data set
   */
  news?: NewsItem[]
}

/**
 * Represents a template file in the Site Pages/Templates folder.
 * Used for creating new news articles based on templates.
 */
export interface TemplateFile {
  /**
   * The name of the template file, e.g., "Project-Template.aspx"
   */
  Name: string
  /**
   * The server-relative URL of the template file
   */
  ServerRelativeUrl: string
}
