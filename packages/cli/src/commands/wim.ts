import {Command} from '@oclif/core';
import {join} from 'path';
import {Preconditions} from '../lib/decorators/preconditions';
import {IsImgcatInstalled} from '../lib/decorators/preconditions/imgcat';
import {Trackable} from '../lib/decorators/preconditions/trackable';
import {appendCmdIfWindows} from '../lib/utils/os';
import {spawnProcess} from '../lib/utils/process';

export default class Wim extends Command {
  public static description = 'Display some Wims';
  private static wimPath = join('/Users/ylakhdar/Desktop/wim'); // TODO: host somewhere else

  public static args = [
    {
      name: 'form',
      description: 'The Wim form of your choice',
      required: true,
    },
  ];

  @Trackable()
  @Preconditions(IsImgcatInstalled())
  public async run() {
    const {args} = await this.parse(Wim);
    this.runImgcatCliCommand(args.form);
  }

  private runImgcatCliCommand(form: string) {
    return spawnProcess(appendCmdIfWindows`imgcat`, [
      join(Wim.wimPath, `${form}.jpg`),
    ]);
  }

  @Trackable()
  public async catch(err?: Error & {exitCode?: number}) {
    throw err;
  }
}
