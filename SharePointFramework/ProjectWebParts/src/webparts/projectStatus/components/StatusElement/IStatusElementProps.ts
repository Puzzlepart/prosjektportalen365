export type StatusElementColumnWidth = 'column1' | 'column2' | 'column3' | 'column4' | 'column6' | 'column8' | 'column10' | 'column11' | 'column12';

export interface IStatusElementProps {
    label: string;
    value: string;
    comment?: string;
    iconName: string;
    height?: string | number;
    iconSize?: number;
    iconColumnWidth?: StatusElementColumnWidth;
    bodyColumnWidth?: StatusElementColumnWidth;    
}