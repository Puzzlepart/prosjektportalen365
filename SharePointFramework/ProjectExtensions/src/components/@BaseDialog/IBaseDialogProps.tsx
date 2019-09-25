import { IDialogProps } from 'office-ui-fabric-react/lib/Dialog';

export interface IBaseDialogProps extends IDialogProps {
    /**
     * @todo Describe property
     */
    title?: string;

    /**
     * Version string from extension manifest
     */
    versionString?: string;
}
