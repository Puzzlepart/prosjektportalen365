/**
 * The extension of a file name, lower case and without its dot, as `FileTypeIcon` takes it; empty
 * when the name has none, which gives the generic file icon.
 *
 * @param fileName The file's name, e.g. `Prosjektplan.DOCX`
 */
export function getFileExtension(fileName: string): string {
  const dot = (fileName ?? '').lastIndexOf('.')
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}
