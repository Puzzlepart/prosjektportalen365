import IProjectSetupApplicationCustomizerData from '../../extensions/projectSetup/IProjectSetupApplicationCustomizerData';
import { IProjectSetupBaseModalProps } from '../ProjectSetupBaseModal/IProjectSetupBaseModalProps';
import { ITemplateSelectModalState } from './ITemplateSelectModalState';

export interface ITemplateSelectModalProps extends IProjectSetupBaseModalProps {
    data: IProjectSetupApplicationCustomizerData;
    onSubmit: (state: ITemplateSelectModalState) => void;
}
