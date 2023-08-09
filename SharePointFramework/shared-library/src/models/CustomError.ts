import { MessageBarType } from '@fluentui/react'

export class CustomError extends Error {
    constructor(error: Error, public type: MessageBarType) {
        super(error.message)
        this.name = error.name
        this.stack = error.stack
    }

    /**
     * Creates a `CustomError` object from an `Error` object.
     * 
     * @param error Error object
     * @param type Type of error (MessageBarType)
     */
    public static createError(error: Error, type: MessageBarType): CustomError {
        return new CustomError(error, type)
    }
}