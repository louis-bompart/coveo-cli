import {appendCmdIfWindows} from '../../utils/os';
import {getBinInstalledPrecondition} from './binPreconditionsFactory';

export const IsImgcatInstalled = getBinInstalledPrecondition(
  appendCmdIfWindows`imgcat`,
  {
    prettyName: 'imgcat',
    howToInstallBinText: 'Install imgcat for some Wim awesomeness.',
  }
);
