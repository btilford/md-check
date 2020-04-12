export class Something {
  log(msg: string, ...args: unknown[]): void {
    console.log(msg, ...args);
  }
}


const log: Something = new Something();
log.log('typescript ok');

export default log;
