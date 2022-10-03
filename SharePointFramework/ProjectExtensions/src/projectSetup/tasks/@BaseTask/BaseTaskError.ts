import { ProjectSetupError } from '../../ProjectSetupError'

export class BaseTaskError extends ProjectSetupError {
  /**
   * Creates a new instance of BaseTaskError
   *
   * @param taskName Task name
   * @param message Message
   * @param stack Stack
   */
  constructor(taskName: string, message: string, stack: any) {
    super(taskName, message, stack)
  }
}
