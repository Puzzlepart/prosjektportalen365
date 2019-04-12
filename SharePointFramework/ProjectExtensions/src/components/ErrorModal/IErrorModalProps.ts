
import { IModalProps } from 'office-ui-fabric-react/lib/Modal';

export interface IErrorModalProps extends IModalProps {
    error: Error;
    version?: string;
}
