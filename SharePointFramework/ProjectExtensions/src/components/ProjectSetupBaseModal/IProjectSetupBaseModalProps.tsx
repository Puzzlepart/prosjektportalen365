import { IModalProps } from 'office-ui-fabric-react/lib/Modal';

export interface IProjectSetupBaseModalProps extends IModalProps {
    /**
     * @todo Describe property
     */
    title?: string;

    /**
     * Version string from extension manifest
     */
    versionString?: string;
}
