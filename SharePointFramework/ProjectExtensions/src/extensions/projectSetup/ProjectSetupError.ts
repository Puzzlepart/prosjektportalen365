import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';

export class ProjectSetupError extends Error {
    constructor(message: string, stack: string, public type = MessageBarType.error) {
        super(message);
        this.stack = stack;
    }
}