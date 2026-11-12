import { SPHttpClient } from '@microsoft/sp-http'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from 'pp365-shared-library/lib/components/BaseWebPartComponent'

/** Configures the news site, project folder and visible article count. */
export interface IProjectNewsProps extends IBaseWebPartComponentProps {
  context: WebPartContext
  /**
   * Absolute URL of the SharePoint site used to read and create project news.
   */
  siteUrl: string
  spHttpClient: SPHttpClient
  maxVisibleNews?: number
  /**
   * The name of the folder where news items should be stored.
   * This is used to ensure the folder exists and to fetch news items from it.
   * If not provided, defaults to 'Project News'.
   */
  newsFolderName?: string
}

/** Loaded news and creation dialog state. */
export interface IProjectNewsState extends IBaseWebPartComponentState<IProjectNewsData> {
  loading?: boolean

  isDialogOpen?: boolean

  isDrawerOpen?: boolean

  /**
   * Timestamp for refetch. Changing this state variable refetches the data in
   * `useProjectNewsDataFetch`.
   */
  refetch?: number
}

/** News page metadata used by the recent-news cards. */
export interface INewsItem {
  id: number
  /** SharePoint's PromotedState value for the page. */
  promotedState: number
  name: string
  /**
   * Absolute URL to the news page
   */
  url: string
  authorName?: string
  modifiedDate?: string
  imageUrl?: string
  description?: string
}
/** News items loaded for the current project. */
export interface IProjectNewsData {
  news?: INewsItem[]
}

/**
 * Represents a template file in the SitePages/Maler (or Templates) folder.
 * Used for creating new news articles based on templates.
 */
export interface TemplateFile {
  Name: string

  Title: string

  ServerRelativeUrl: string
}
