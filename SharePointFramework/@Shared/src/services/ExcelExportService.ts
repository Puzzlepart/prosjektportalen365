import { IExcelExportSheet } from "../interfaces";
import * as $script from 'scriptjs';
import { stringToArrayBuffer } from "../util";

export default new class ExcelExportService {
    protected options = { type: "binary", bookType: "xlsx" };

    protected loadDeps() {
        return new Promise<void>(_ => {
            if (!(<any>window).XLSX) {
                $script([
                    'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js',
                    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.14.5/xlsx.min.js',
                ], _);
            } else {
                _();
            }
        })
    }

    /**
     * Export to Excel
     * 
     * @param {IExcelExportSheet[]} sheets Sheets
     * @param {string} fileName File name
     */
    public async export(sheets: IExcelExportSheet[], fileName: string) {
        await this.loadDeps();
        const workBook = (<any>window).XLSX.utils.book_new();
        sheets.forEach((s, index) => {
            const sheet = (<any>window).XLSX.utils.aoa_to_sheet(s.data);
            (<any>window).XLSX.utils.book_append_sheet(workBook, sheet, s.name || `Sheet${index + 1}`);
        });
        const wbout = (<any>window).XLSX.write(workBook, this.options);
        (<any>window).saveAs(new Blob([stringToArrayBuffer(wbout)], { type: "application/octet-stream" }), fileName);
    }
};