import { IModalProps } from 'office-ui-fabric-react/lib/Modal';

export interface IProjectSetupBaseModalProps extends IModalProps {
    title?: string;
    versionString?: string;
}
