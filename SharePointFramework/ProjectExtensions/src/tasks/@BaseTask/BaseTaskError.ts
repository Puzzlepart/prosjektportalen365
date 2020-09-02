import { ProjectSetupError } from '../../extensions/projectSetup/ProjectSetupError'

export class BaseTaskError extends ProjectSetupError {
    /**
     * Creates a new instance of BaseTaskError
     * 
     * @param {string} taskName Task name
     * @param {string} message Message
     * @param {string} stack Stack
     */
    constructor(taskName: string, message: string, stack: any) {
        super(taskName, message, stack)
    }
}