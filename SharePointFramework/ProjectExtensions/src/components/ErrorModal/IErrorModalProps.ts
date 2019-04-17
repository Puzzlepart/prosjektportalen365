import { ProjectSetupError } from '../../extensions/projectSetup/ProjectSetupError';
import { IProjectSetupBaseModalProps } from '../ProjectSetupBaseModal/IProjectSetupBaseModalProps';

export interface IErrorModalProps extends IProjectSetupBaseModalProps {
    error: ProjectSetupError;
}
