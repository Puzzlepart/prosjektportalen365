import { parseErrorStack } from 'shared/lib/helpers/parseErrorStack'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'

export class ProjectSetupError extends Error {
    /**
     * Creates a new instance of ProjectSetupError
     * 
     * @param {string} taskName Task name
     * @param {string} message Message
     * @param {string} stack Stack
     * @param {MessageBarType} messageType Message type
     */
    constructor(taskName: string, message: string, stack: any, public messageType = MessageBarType.error) {
        super(message)
        this.name = taskName
        this.stack = parseErrorStack(stack)
    }
}