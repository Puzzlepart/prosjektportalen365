import { ProjectSetupError } from '../../extensions/projectSetup/ProjectSetupError';
import { IBaseDialogProps } from '../@BaseDialog/IBaseDialogProps';

export interface IErrorModalProps extends IBaseDialogProps {
    error: ProjectSetupError;
}
