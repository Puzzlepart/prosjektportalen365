import { SPHttpClient } from '@microsoft/sp-http'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from 'pp365-shared-library/lib/components/BaseWebPartComponent'

export interface IProjectNewsProps extends IBaseWebPartComponentProps {
  /**
   * The context of the web part, used for making SharePoint HTTP requests.
   * This is typically provided by the SharePoint Framework.
   */
  context: WebPartContext
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
   * Indicates whether the news creation dialog is open.
   */
  isDialogOpen?: boolean

  /**
   * Indicates whether the preview drawer is open.
   */
  isDrawerOpen?: boolean

  /**
   * Timestamp for refetch. Changing this state variable refetches the data in
   * `useProjectNewsDataFetch`.
   */
  refetch?: number
}

export interface NewsItem {
  /**
   * Unique identifier for the news item
   */
  Id: number
  /**
   * The state of the news item, indicating its visibility or promotion status.
   * 0 for draft, 1 for published, and 2 for promoted. This is the promoted state in SharePoint.
   */
  PromotedState: number
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
   * Last modified date/time (optional)
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
/**
 * Interface for the project news data, which includes an array of news items.
 * This is used to pass news data to components like RecentNews.
 */
export interface IProjectNewsData {
  /**
   * Array of news items
   */
  news?: NewsItem[]
}

/**
 * Represents a template file in the SitePages/Maler (or Templates) folder.
 * Used for creating new news articles based on templates.
 */
export interface TemplateFile {
  /**
   * The name of the template file, e.g., "Project-Template.aspx"
   */
  Name: string

  /**
   * The title of the template file
   */
  Title: string

  /**
   * The server-relative URL of the template file
   */
  ServerRelativeUrl: string
}
