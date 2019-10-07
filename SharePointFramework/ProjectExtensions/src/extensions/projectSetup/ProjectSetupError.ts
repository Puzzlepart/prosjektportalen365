import { parseErrorStack } from 'shared/lib/helpers/parseErrorStack';

export class ProjectSetupError extends Error {
    /**
     * Creates a new instance of ProjectSetupError
     * 
     * @param {string} taskName Task name
     * @param {string} message Message
     * @param {string} stack Stack
     */
    constructor(taskName: string, message: string, stack: any) {
        super(message);
        this.name = taskName;
        this.stack = parseErrorStack(stack);
    }
}