
export class BaseTaskError {
    constructor(
        public task: string,
        public message: any,
    ) {
        this.task = task;
        if (typeof message === 'string') {
            this.message = message;
        } else if (message.hasOwnProperty && message.hasOwnProperty('args')) {
            this.message = (message.args as SP.ClientRequestFailedEventArgs).get_message();
        } else {
            this.message = 'Ukjent feil';
        }
    }
}