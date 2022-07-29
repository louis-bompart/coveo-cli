import {readFileSync} from 'node:fs';
import http, {IncomingMessage, ServerResponse} from 'node:http';
import {resolve} from 'node:path';

// const html = readFileSync(__dirname + '/index.html');
const hostname = '127.0.0.1';
const port = 3000;

const serveStaticFiles = (req: IncomingMessage, res: ServerResponse) => {
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

const serveDiffFiles = (req: IncomingMessage, res: ServerResponse) => {
  const files: {} = []; // TODO:
  res.setHeader('Content-Type', 'application/json');

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

  res.writeHead(200);
  res.end(files);
};

const serveHtmlPage = (req: IncomingMessage, res: ServerResponse) => {
  const html = readFileSync(__dirname + '/index.html');
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200);
  res.end(html);
};

const router = (req: IncomingMessage, res: ServerResponse) => {
  if (req.url?.match('node_modules')) {
    serveStaticFiles(req, res);
  } else if (req.url === '/favicon.ico') {
    throw 'TODO:';
  } else if (req.url === 'diff') {
    serveDiffFiles(req, res);
  } else {
    serveHtmlPage(req, res);
  }
};

const requestListener = (req: IncomingMessage, res: ServerResponse) => {
  try {
    router(req, res);
  } catch (error: unknown) {
    console.error(error);
    res.writeHead(500);
    res.end('Something went wrong. Look at your terminal');
  }
};

const server = http.createServer(requestListener);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log('Enter Ctr+c to exit');
});
