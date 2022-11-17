import { format } from '@uifabric/utilities'
import strings from 'ProjectExtensionsStrings'
import { BaseTaskError } from '../@BaseTask'
import { ProvisioningError } from 'sp-js-provisioning'

export class ApplyTemplateTaskError extends BaseTaskError {
  /**
   * Creates a new instance of `ApplyTemplateTaskError`
   *
   * @param error Provisioning error from `sp-js-provisioning`
   */
  constructor(error: ProvisioningError) {
    super(
      'ApplyTemplate',
      `${format(strings.ApplyTemplateErrorMessage, error.handler)}: ${error.message}`,
      error
    )
  }
}
