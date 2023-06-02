import { DataSource } from 'pp365-shared-library/lib/models'

export interface IAggregatedListConfiguration {
  viewsUrls: { defaultNewFormUrl: string; defaultEditFormUrl: string }
  columnUrls: { defaultNewFormUrl: string; defaultEditFormUrl: string }
  views?: DataSource[]
  level?: string
  levels?: string[]
}
