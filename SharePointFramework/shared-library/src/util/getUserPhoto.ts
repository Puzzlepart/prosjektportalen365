/**
 * Builds the SharePoint user-photo endpoint for an account and image size.
 */
export function getUserPhoto(email: string, size = 'L'): string {
  return `/_layouts/15/userphoto.aspx?size=${size}&accountname=${email}`
}
