import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'

export class PortfolioOverviewErrorMessage extends Error {
    constructor(public message: string, public type: MessageBarType) {
        super(message)
    }
}
