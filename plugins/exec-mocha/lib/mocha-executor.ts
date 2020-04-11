import {Executor, ExecutorOptions} from '@btilford/md-check';


export type MochaExecutorOptions = ExecutorOptions & {}


export class MochaExecutor extends Executor {

  constructor(options: MochaExecutorOptions) {
    super(options);
  }


}
