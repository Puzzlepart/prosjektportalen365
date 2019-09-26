import { ProjectSetupError } from '../../extensions/projectSetup/ProjectSetupError';
import { IBaseDialogProps } from '../@BaseDialog/IBaseDialogProps';

export interface IErrorDialogProps extends IBaseDialogProps {
    /**
     * @todo Describe property
     */
    error: ProjectSetupError;
}
