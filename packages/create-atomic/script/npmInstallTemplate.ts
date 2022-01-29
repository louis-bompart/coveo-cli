import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {cwd} from 'node:process';
import {copyFileSync} from 'fs';
import {appendCmdIfWindows} from '../src/utils.js';

(async () =>
  await new Promise((resolve, reject) => {
    copyFileSync('package-lock.json', join('templates', 'package-lock.json'));
    const childProcess = spawn(
      appendCmdIfWindows('npm'),
      [process.env.CI ? 'ci' : 'install', '--ignore-scripts'],
      {
        stdio: 'inherit',
        cwd: join(cwd(), 'templates'),
      }
    );

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve('Packages installed correctly');
      } else {
        reject(`npm install exited with ${code}`);
      }
    });
  }))();
