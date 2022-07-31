import {readdirSync} from 'fs-extra';
import {join} from 'path';

const firstDirOfPath =
  process.platform === 'win32' ? /^[^\\]*(?=\\)/m : /^[^/]*\//m;

export function getAllFilesPath(
  currentDir: string,
  filePaths: Set<string> = new Set<string>()
) {
  const files = readdirSync(currentDir, {withFileTypes: true});
  files.forEach((file) => {
    if (file.isDirectory()) {
      getAllFilesPath(join(currentDir, file.name), filePaths);
    } else {
      filePaths.add(join(currentDir, file.name).replace(firstDirOfPath, ''));
    }
  });
  return filePaths;
}
