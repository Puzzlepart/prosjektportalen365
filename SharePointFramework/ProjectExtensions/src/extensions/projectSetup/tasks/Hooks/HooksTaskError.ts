import strings from 'ProjectExtensionsStrings'
import { BaseTaskError } from '../@BaseTask'
import { ProvisioningError } from 'sp-js-provisioning'
import { format } from 'pp365-shared-library'
import { withReason } from '../../readableError'

/** Hook-provisioning failure with the handler name and a readable underlying reason. */
export class HooksTaskError extends BaseTaskError {
  constructor(error: ProvisioningError) {
    super(
      'Hooks',
      withReason(format(strings.ApplyTemplateErrorMessage, error?.handler), error),
      error
    )
  }
}
