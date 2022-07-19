import {Command} from '@oclif/core';
import {join} from 'path';
import {Preconditions} from '../../lib/decorators/preconditions';
import {IsImgcatInstalled} from '../../lib/decorators/preconditions/imgcat';
import {Trackable} from '../../lib/decorators/preconditions/trackable';
import {appendCmdIfWindows} from '../../lib/utils/os';
import {spawnProcess} from '../../lib/utils/process';

export default class WimFrench extends Command {
  public static description = 'Display French Wim';
  private static wimPath = join(__dirname, '../../lib/wim');

  @Trackable()
  @Preconditions(IsImgcatInstalled())
  public async run() {
    this.runImgcatCliCommand();
  }

  private runImgcatCliCommand() {
    return spawnProcess(appendCmdIfWindows`imgcat`, [
      join(WimFrench.wimPath, 'wim-french.jpg'),
    ]);
  }

  @Trackable()
  public async catch(err?: Error & {exitCode?: number}) {
    throw err;
  }
}
