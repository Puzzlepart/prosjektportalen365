import { useModel } from '../useModel'
import { useSubmit } from '../useSubmit'

export interface IEditPropertiesPanelFooterProps {
  submit: ReturnType<typeof useSubmit>;
  model: ReturnType<typeof useModel>;
}
