export interface ISPUser {
  'odata.type': string
  'odata.id': string
  'odata.editLink': string
  Id: number
  IsHiddenInUI: boolean
  LoginName: string
  Title: string
  PrincipalType: number
  Email: string
  IsEmailAuthenticationGuestUser: boolean
  IsShareByEmailGuestUser: boolean
  IsSiteAdmin: boolean
  UserId: any
}
