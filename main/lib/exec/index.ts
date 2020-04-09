import {ExecutionRenderer} from './execution-renderer';
import {Executor} from './executor';


export * from './executor';
export * from './execution-renderer';

export type ExecutorConfig = [Executor, ExecutionRenderer];

