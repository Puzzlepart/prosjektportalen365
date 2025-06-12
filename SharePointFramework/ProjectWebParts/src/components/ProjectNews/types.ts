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
 * This is used to pass news data to components like RecentNewsList.
 */
export interface IProjectNewsData {
  /**
   * Array of news items
   */
  news?: NewsItem[]
}

/**
 * Props for the RecentNewsList component, which displays a list of recent news items.
 * It extends the IProjectNewsData interface to include news data.
 * The maxVisible prop controls how many news items are displayed initially.
 */
export interface RecentNewsListProps extends IProjectNewsData {
  /**
   * The maximum number of news items to display initially.
   * If set, the component will show this many items before allowing the user to see more.
   */
  maxVisible?: number
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

/**
 * Props for the NewsDialog component, which is used to create news articles.
 * It includes properties for managing the dialog state, title, error messages,
 * and handlers for form submission and template selection.
 */
export interface NewsDialogProps {
  /**
   * Whether the dialog is open or not
   */
  open: boolean
  /**
   * Callback to handle opening and closing the dialog
   * @param open - true if the dialog should be open, false otherwise
   */
  onOpenChange: (open: boolean) => void
  /**
   * The current state of the spinner in the dialog
   * - 'idle': No action is being performed
   * - 'creating': A new news article is being created
   * - 'success': The news article has been successfully created
   */
  spinnerMode: 'idle' | 'creating' | 'success'
  /**
   * The title of the news article being created
   */
  title: string
  /**
   * The error message to display in the dialog when an error occurs
   */
  errorMessage: string
  /**
   * Handler for title input changes
   * @param e - The event object
   * @param data - The data containing the new title value
   */
  onTitleChange: (e: React.FormEvent, data: { value: string }) => void
  /**
   * Handler for form submission
   * @param e - The event object
   */
  onSubmit: (e: React.FormEvent) => void
  /**
   * Array of available templates for creating news articles
   */
  templates: any[]
  /**
   * The currently selected template for creating a news article
   */
  selectedTemplate?: string
  /**
   * Handler for template selection changes
   * @param e - The event object
   * @param data - The data containing the selected template option value
   */
  onTemplateChange: (e: React.FormEvent, data: { optionValue: string }) => void
}
