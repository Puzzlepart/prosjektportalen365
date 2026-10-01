import strings from 'ProjectExtensionsStrings'
import { BaseTaskError } from '../@BaseTask'
import { ProvisioningError } from 'sp-js-provisioning'
import { format } from 'pp365-shared-library'

export class HooksTaskError extends BaseTaskError {
  /**
   * Creates a new instance of `HooksTaskError`
   *
   * @param error Provisioning error from `sp-js-provisioning`
   */
  constructor(error: ProvisioningError) {
    super(
      'Hooks',
      `${format(strings.ApplyTemplateErrorMessage, error.handler)}: ${error.message}`,
      error
    )
  }
}
