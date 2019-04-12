
export class ProjectSetupError extends Error {
    constructor(message: string, stack: string) {
        super();
        this.message = message;
        this.stack = stack;
    }
}