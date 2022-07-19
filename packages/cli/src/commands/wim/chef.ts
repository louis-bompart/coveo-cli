import {Command} from '@oclif/core';
import {join} from 'path';
import {Preconditions} from '../../lib/decorators/preconditions';
import {IsImgcatInstalled} from '../../lib/decorators/preconditions/imgcat';
import {Trackable} from '../../lib/decorators/preconditions/trackable';
import {appendCmdIfWindows} from '../../lib/utils/os';
import {spawnProcess} from '../../lib/utils/process';

export default class WimChef extends Command {
  public static description = 'Display Chef Wim';
  private static wimPath = join(__dirname, '../../lib/wim');

  @Trackable()
  @Preconditions(IsImgcatInstalled())
  public async run() {
    this.runImgcatCliCommand();
  }

  private runImgcatCliCommand() {
    return spawnProcess(appendCmdIfWindows`imgcat`, [
      join(WimChef.wimPath, 'wim-chef.jpg'),
    ]);
  }

  @Trackable()
  public async catch(err?: Error & {exitCode?: number}) {
    throw err;
  }
}
