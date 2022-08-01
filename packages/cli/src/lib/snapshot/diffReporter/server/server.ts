import {CliUx} from '@oclif/core';
import {applyPatch} from 'diff';
import {readFileSync} from 'node:fs';
import http, {IncomingMessage, Server, ServerResponse} from 'node:http';
import {resolve} from 'node:path';
import open from 'open';

export type DiffFilePaths = {originalFile: string; patchFile: string}[];

export class DiffServer {
  private static hostname = '127.0.0.1';
  private static port = 3000; // TODO: Get a unsused port

  public constructor(private tuples: DiffFilePaths) {
    const url = `http://${DiffServer.hostname}:${DiffServer.port}`;
    http
      .createServer(this.requestListener)
      .listen(DiffServer.port, DiffServer.hostname, () => {
        console.log(`Diff available at ${url}/`);
        console.log('Enter ctr+c to exit');
        open(url);
      });
  }

  private router = (req: IncomingMessage, res: ServerResponse) => {
    // TODO: maybe in a separate class
    if (req.url?.match('node_modules')) {
      this.serveStaticFiles(req, res);
    } else if (req.url === '/diff') {
      this.serveDiffFiles(req, res);
    } else if (req.url === '/') {
      this.serveHtmlPage(req, res);
    } else {
      res.writeHead(404);
      res.end('Nope');
    }
  };

  private serveStaticFiles = (req: IncomingMessage, res: ServerResponse) => {
    const nodeModulesLevelDeep = new Array(7).fill('..');
    if (!req.url) {
      return;
    }

    try {
      const filePath = resolve(
        __dirname,
        ...nodeModulesLevelDeep,
        ...req.url.split('/')
      );
      res.writeHead(200);
      res.end(readFileSync(filePath));
    } catch (error) {
      res.writeHead(404);
      res.end(JSON.stringify(error));
    }
  };

  private serveHtmlPage = (req: IncomingMessage, res: ServerResponse) => {
    const htmlPath = require.resolve('./index.html');
    const html = readFileSync(htmlPath);

    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(html);
  };

  private serveDiffFiles = (req: IncomingMessage, res: ServerResponse) => {
    // const patchPaths = join(this.project.pathToProject, 'diffs'); // TODO: make the project create a diff folder
    // const patchFilePaths = getAllFilesPath(patchPaths);
    const tuples = [];

    for (const {originalFile, patchFile} of this.tuples) {
      const original = readFileSync(originalFile).toString();
      const patch = readFileSync(patchFile).toString();

      // const modified = applyPatch(original, patch);
      const modified = patch;
      tuples.push({original, modified}); // TODO: stream instead of saving in disk
    }
    // for (const patchPath of patchFilePaths) {
    //   const patch = readFileSync(patchPath);
    //   const modified = applyPatch(original, patch.toString());
    //   tuples.push({original, modified});
    // }

    // var stream = fs.createReadStream(fileLoc);

    //       // Handle non-existent file
    //       stream.on('error', function(error) {
    //           res.writeHead(404, 'Not Found');
    //           res.write('404: File Not Found!');
    //           res.end();
    //       });

    //       // File exists, stream it to user
    //       res.statusCode = 200;
    //       stream.pipe(res);

    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(tuples));
  };

  private requestListener = (req: IncomingMessage, res: ServerResponse) => {
    try {
      this.router(req, res);
    } catch (error: unknown) {
      console.error(error);
      res.writeHead(500);
      res.end('Something went wrong. Look at your terminal');
    }
  };
}
