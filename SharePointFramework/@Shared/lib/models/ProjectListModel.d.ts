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
export declare class ProjectListModel {
    Id: string;
    Title: string;
    Url: string;
    Logo: string;
    Phase: string;
    Manager: ISPUser;
    Owner: ISPUser;
}
