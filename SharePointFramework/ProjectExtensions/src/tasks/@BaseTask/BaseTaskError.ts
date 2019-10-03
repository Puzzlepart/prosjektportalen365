import { ProjectSetupError } from '../../extensions/projectSetup/ProjectSetupError';

export class BaseTaskError extends ProjectSetupError {
    constructor(
        public taskName: string,
        message: string,
        stack: string
    ) {
        super(message, stack);
    }
}