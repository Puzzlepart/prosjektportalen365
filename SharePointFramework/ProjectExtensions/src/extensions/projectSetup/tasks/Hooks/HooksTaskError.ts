import strings from 'ProjectExtensionsStrings'
import { BaseTaskError } from '../@BaseTask'
import { ProvisioningError } from 'sp-js-provisioning'
import { format } from 'pp365-shared-library'
import { withReason } from '../../readableError'

export class HooksTaskError extends BaseTaskError {
  /**
   * Creates a new instance of `HooksTaskError`: the handler that failed, and what it failed with in
   * words (see `readableErrorMessage`).
   *
   * @param error Provisioning error from `sp-js-provisioning`
   */
  constructor(error: ProvisioningError) {
    super(
      'Hooks',
      withReason(format(strings.ApplyTemplateErrorMessage, error?.handler), error),
      error
    )
  }
}
