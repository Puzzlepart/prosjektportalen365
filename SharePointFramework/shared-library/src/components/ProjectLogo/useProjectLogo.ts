/**
 * Custom React hook for and managing project logo.
 *
 * @param props - The props for the ProjectLogo component.
 *
 * @returns An object containing the conditional styling based on project logo type.
 */
export function useProjectLogo() {
  /**
   * Checks if the image is a custom image.
   *
   * @param image - The image to check.
   *
   * @returns A boolean indicating if the image is a custom image.
   *
   */
  const useCustomImage = (image: React.SyntheticEvent<HTMLImageElement, Event>) => {
    return (image.target as HTMLImageElement).naturalHeight !== 648
      ? (image.target as HTMLImageElement).naturalHeight !== 96
        ? true
        : false
      : false
  }

  return {
    useCustomImage
  }
}
