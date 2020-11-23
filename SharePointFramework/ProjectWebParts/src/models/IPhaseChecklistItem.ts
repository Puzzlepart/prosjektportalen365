export interface IPhaseChecklistItem {
  ID: number
  Title: string
  GtComment: string
  GtChecklistStatus: string
  GtProjectPhase: {
    TermGuid: string
  }
}
