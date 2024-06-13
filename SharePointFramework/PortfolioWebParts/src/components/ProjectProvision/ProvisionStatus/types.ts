
export interface IRequestItem {
  id: number
  displayName: string
  title: string
  siteUrl: string
  created: Date
  status: string
  type: string
}

export enum Status {
  NotSubmitted = 'Not Submitted',
  Submitted = 'Submitted',
  Approved = 'Approved',
  Rejected = 'Rejected',
  PendingApproval = 'Pending Approval',
  SpaceCreationFailed = 'Space Creation Failed',
  SpaceAlreadyExists = 'Space Already Exists',
  TeamRequested = 'Team Requested',
  SpaceCreation = 'Space Creation',
  SpaceCreated = 'Space Created'
}
