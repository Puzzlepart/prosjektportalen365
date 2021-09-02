export function getUserPhoto(email: string, size = 'L'): string {
  return `/_layouts/15/userphoto.aspx?size=${size}&accountname=${email}`
}
