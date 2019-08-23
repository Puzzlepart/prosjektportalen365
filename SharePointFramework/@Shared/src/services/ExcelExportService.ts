import * as moment from 'moment';
import * as $script from 'scriptjs';
import * as format from 'string-format';
import { getObjectValue } from "../helpers/getObjectValue";
import { stringToArrayBuffer } from "../util";

export default new class ExcelExportService {
    protected _fileSaverVersion: string;
    protected _xlsxVersion: string;
    protected _options: { type: string; bookType: string; };
    protected _deps: string[];

    constructor() {
        this._fileSaverVersion = '1.3.8';
        this._xlsxVersion = '0.14.5';
        this._options = { type: "binary", bookType: "xlsx" };
        this._deps = [`FileSaver.js/${this._fileSaverVersion}/FileSaver.min.js`, `xlsx/${this._xlsxVersion}/xlsx.full.min.js`];
        $script.path('https://cdnjs.cloudflare.com/ajax/libs/');
    }

    /**
     * Load deps
     * 
     * @param {string[]} deps Deps
     */
    protected loadDeps() {
        return new Promise<void>(_ => {
            let _define = (<any>window).define;
            (<any>window).define = undefined;
            $script(this._deps, 'deps');
            $script.ready('deps', () => {
                (<any>window).define = _define;
                _();
            })
        })
    }

    /**
     * Export to Excel
     * 
     * @param {string} title Title
     * @param {any[]} items Items
     * @param {any[]} columns Columns
     */
    public async export(title: string, items: any[], columns: any[]) {
        try {
            await this.loadDeps();
            const sheets = [];
            let _columns = columns.filter(column => column.name);
            sheets.push({
                name: 'Sheet1',
                data: [
                    _columns.map(column => column.name),
                    ...items.map(item => _columns.map(column => getObjectValue<string>(item, column.fieldName, null))),
                ],
            });
            const fileName = format("{0}-{1}.xlsx", title, moment(new Date().toISOString()).format('YYYY-MM-DD-HH-mm'));
            const workBook = (<any>window).XLSX.utils.book_new();
            sheets.forEach((s, index) => {
                const sheet = (<any>window).XLSX.utils.aoa_to_sheet(s.data);
                (<any>window).XLSX.utils.book_append_sheet(workBook, sheet, s.name || `Sheet${index + 1}`);
            });
            const wbout = (<any>window).XLSX.write(workBook, this._options);
            (<any>window).saveAs(new Blob([stringToArrayBuffer(wbout)], { type: "application/octet-stream" }), fileName);
        } catch (error) {
            throw new Error(error);
        }
    }
};