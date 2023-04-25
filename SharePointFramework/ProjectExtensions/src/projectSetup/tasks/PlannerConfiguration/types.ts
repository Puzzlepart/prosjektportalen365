import { stringIsNullOrEmpty } from '@pnp/common'

export interface IPlannerPlan {
  title: string
  id?: string
  owner?: string
}

export class TaskAttachment {
  public url: string
  public alias: string
  public type: string

  constructor(str: string) {
    const [url, alias, type] = str.split(';')
    this.url = this._encodeUrl(url)
    this.alias = alias || url
    this.type = this._getType(url, type)
  }

  /**
   * Get type of attachment from URL
   *
   * @param url URL
   * @param type Type
   */
  private _getType(url: string, type: string) {
    if (!stringIsNullOrEmpty(type)) return type
    if (url.endsWith('ppt') || url.endsWith('pptx')) return 'PowerPoint'
    if (url.endsWith('xls') || url.endsWith('xlsx')) return 'Excel'
    if (url.endsWith('doc') || url.endsWith('docx')) return 'Word'
    if (url.endsWith('pdf')) return 'Pdf'
    return 'Other'
  }

  /**
   * Encode URL, replacing %, . and :
   *
   * @see https://docs.microsoft.com/en-gb/graph/api/resources/plannerexternalreferences?view=graph-rest-1.0
   *
   * @param url URL
   */
  private _encodeUrl(url: string) {
    return url.split('%').join('%25').split('.').join('%2E').split(':').join('%3A')
  }
}

export type TaskPreviewType = 'automatic' | 'noPreview' | 'checklist' | 'description' | 'reference'

export interface ITaskDetails {
  description?: string
  checklist?: string[]
  labels?: string[]
  attachments?: TaskAttachment[]
  previewType?: TaskPreviewType
}

export interface IPlannerConfiguration {
  [key: string]: {
    [key: string]: ITaskDetails
  }
}

export interface IPlannerBucket {
  id: string
  name: string
  planId: string
}
