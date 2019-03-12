import { IModalProps } from 'office-ui-fabric-react/lib/Modal';

export type NewStatusReportModalFieldType = 'text' | 'note' | 'choice';

export interface INewStatusReportModalField {
    fieldType: NewStatusReportModalFieldType;
    fieldName: string;
    title: string;
    choices: any;
}

export interface INewStatusReportModalProps extends IModalProps {
    fields: INewStatusReportModalField[];
    onSave: (model: { [key: string]: string }) => Promise<void>;
}