import { IBaseTaskParams } from './IBaseTaskParams'
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction'
export interface IBaseTask {
  params: IBaseTaskParams
  taskName: string
  execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams>
}
