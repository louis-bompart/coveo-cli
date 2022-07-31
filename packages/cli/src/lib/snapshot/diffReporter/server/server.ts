import {applyPatch} from 'diff';
import {readFileSync} from 'node:fs';
import http, {IncomingMessage, Server, ServerResponse} from 'node:http';
import {join, resolve} from 'node:path';
import {Project} from '../../../project/project';
import {getAllFilesPath} from '../filesDiffProcessor';

// const html = readFileSync(__dirname + '/index.html');

export class DiffServer {
  private static hostname = '127.0.0.1';
  private static port = 3000;
  private server: Server;

  public constructor(private project: Project) {
    this.server = http.createServer(this.requestListener);

    this.server.listen(DiffServer.port, DiffServer.hostname, () => {
      console.log(
        `Server running at http://${hostnameDiffServer.hostname}:${DiffServer.port}/`
      );
      // TODO: open page in browser
      console.log('Enter Ctr+c to exit');
    });
  }

  private router = (req: IncomingMessage, res: ServerResponse) => {
    // TODO: maybe in a separate class
    if (req.url?.match('node_modules')) {
      this.serveStaticFiles(req, res);
    } else if (req.url === 'diff') {
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
    const html = readFileSync(__dirname + '/index.html');
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(html);
  };

  private serveDiffFiles = (req: IncomingMessage, res: ServerResponse) => {
    // const patchPaths = join(this.project.pathToProject, 'diffs'); // TODO: make the project create a diff folder
    // const patchFilePaths = getAllFilesPath(patchPaths);
    const tuples = [];

    this.project.contains;
    for (const [originalPath, patchPath] of this.project.tuples()) {
      const original = readFileSync(originalPath);
      const patch = readFileSync(patchPath);
      const modified = applyPatch(original.toString(), patch.toString());
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
