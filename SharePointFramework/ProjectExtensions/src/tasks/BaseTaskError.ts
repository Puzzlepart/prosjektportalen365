
export class BaseTaskError extends Error {
    constructor(
        public taskName: string,
        message: string,
        stack: string
    ) {
        super();
        this.message = message;
        this.stack = stack;
    }
}