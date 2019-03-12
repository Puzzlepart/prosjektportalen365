
export interface IUserDetails {
  name: string;
  email: string;
  profileImageSrc: string;
}

export interface ISPUser {
  'odata.type': string;
  'odata.id': string;
  'odata.editLink': string;
  Id: number;
  IsHiddenInUI: boolean;
  LoginName: string;
  Title: string;
  PrincipalType: number;
  Email: string;
  IsEmailAuthenticationGuestUser: boolean;
  IsShareByEmailGuestUser: boolean;
  IsSiteAdmin: boolean;
  UserId: any;
}

export default class ProjectListModel {
  public Id: string;
  public Title: string;
  public Url: string;
  public Logo: string;
  public Phase: string;
  public Manager: ISPUser;
  public Owner: ISPUser;
}
