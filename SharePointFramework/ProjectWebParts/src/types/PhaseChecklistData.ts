import { IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'

export type PhaseChecklistData = {
  stats?: {
    [status: string]: number
  }
  items?: IProjectPhaseChecklistItem[]
}
