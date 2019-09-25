import IProjectSetupApplicationCustomizerData from '../../extensions/projectSetup/IProjectSetupApplicationCustomizerData';
import { IProjectSetupBaseModalProps } from '../ProjectSetupBaseModal/IProjectSetupBaseModalProps';
import { ITemplateSelectDialogState } from './ITemplateSelectDialogState';

export interface ITemplateSelectDialogProps extends IProjectSetupBaseModalProps {
    /**
     * @todo Describe property
     */
    data: IProjectSetupApplicationCustomizerData;

    /**
     * @todo Describe property
     */
    onSubmit: (state: ITemplateSelectDialogState) => void;
}
