/**
 * Stand-ins for the setup dialog's models (`ProjectTemplate`, `ProjectExtension`,
 * `ContentConfig`) that carry only what the dialog, its reducer and its sections read.
 */

export function extension(id: number, text: string, { mandatoryFor = [] as number[] } = {}) {
  return {
    id,
    key: `ext-${id}`,
    text,
    subText: `Om ${text}`,
    hidden: false,
    isDefaultForTemplate: () => false,
    isMandatoryForTemplate: (template: { id: number }) => mandatoryFor.includes(template?.id)
  } as any
}

export function contentConfig(id: number, text: string, { mandatoryFor = [] as number[] } = {}) {
  return { ...extension(id, text, { mandatoryFor }), key: `cc-${id}` } as any
}

export function template(
  id: number,
  text: string,
  {
    isDefault = false,
    isCloudTemplate = false,
    extensions = [] as number[],
    contentConfig = [] as number[]
  } = {}
) {
  return {
    id,
    text,
    subText: `Om ${text}`,
    hidden: false,
    isDefault,
    isCloudTemplate,
    cloudSourceUrl: isCloudTemplate ? `https://katalog.example/${id}.pppkg` : undefined,
    iconProps: { iconName: 'Page' },
    extensions,
    contentConfig,
    getExtensions: (all: any[]) => all.filter((item) => extensions.includes(item.id)),
    getContentConfig: (all: any[]) => all.filter((item) => contentConfig.includes(item.id))
  } as any
}

export const EXTENSIONS = [extension(1, 'Gevinstoversikt'), extension(2, 'Risikomatrise')]
export const CONTENT_CONFIG = [contentConfig(10, 'Fasesjekkliste'), contentConfig(11, 'Planner')]
export const TEMPLATES = [
  template(1, 'Standardmal', { isDefault: true, extensions: [1], contentConfig: [10] }),
  template(2, 'Byggeprosjekt', { extensions: [2], contentConfig: [10, 11] })
]

/** The setup data the customizer hands the dialog, with the two templates above. */
export function setupData(overrides: Record<string, any> = {}) {
  return {
    templates: TEMPLATES,
    extensions: EXTENSIONS,
    contentConfig: CONTENT_CONFIG,
    ...overrides
  } as any
}
