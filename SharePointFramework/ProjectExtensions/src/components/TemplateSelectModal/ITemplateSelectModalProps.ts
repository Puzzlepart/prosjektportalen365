import IProjectSetupApplicationCustomizerData from '../../extensions/projectSetup/IProjectSetupApplicationCustomizerData';
import { IProjectSetupBaseModalProps } from '../ProjectSetupBaseModal/IProjectSetupBaseModalProps';

export interface ITemplateSelectModalProps extends IProjectSetupBaseModalProps {
    data: IProjectSetupApplicationCustomizerData;
    onSubmit: (data: IProjectSetupApplicationCustomizerData) => void;
}
