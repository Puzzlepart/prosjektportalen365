import { TypedHash } from '@pnp/common'

export interface ParentModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export const userCustomAction: TypedHash<string> = {
  Title: 'ProjectSetup',
  Location: 'ClientSideExtension.ApplicationCustomizer',
  ClientSideComponentId: 'ce34553d-ab47-4107-8dd1-e980d953996d',
  ClientSideComponentProperties:
    '{"templatesLibrary":"Prosjektmaler","extensionsLibrary":"Prosjekttillegg","projectsList": "Prosjekter","contentConfigList":"Listeinnhold","termSetIds":{"GtProjectPhase": "abcfc9d9-a263-4abb-8234-be973c46258a","GtResourceRole": "54da9f47-c64e-4a26-80f3-4d3c3fa1b7b2"},"forceTemplate":"Overordnet.txt"}'
}
