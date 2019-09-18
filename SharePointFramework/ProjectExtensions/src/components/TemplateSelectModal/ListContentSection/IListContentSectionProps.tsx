import { ListContentConfig } from '../../../models';

export interface IListContentSectionProps {
    listContentConfig: ListContentConfig[];
    onChange: (obj: { selectedListConfig: ListContentConfig[] }) => void;
}
