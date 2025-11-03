const { Command } = require('commander');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');
const superagent = require('superagent');

const program = new Command();
program
    .option('-h, --host <host>', 'server host (e.g. localhost)')
    .option('-p, --port <number>', 'server port (e.g. 3000)')
    .option('-c, --cache <cacheDir>', 'cache directory path');

program.parse(process.argv);
const options = program.opts();

if(!fsSync.existsSync(options.cache)){
    fsSync.mkdirSync(options.cache, {recursive: true});
    console.log(`Cache folder created: ${options.cache}`); 
}

if (!options.host || !options.port || !options.cache){
    console.error('Error: missing required parameters (--host, --port, --cache)')
    process.exit(1);
}
const server = http.createServer(async (req, res) => {
  const code = req.url.slice(1);
  const filePath = path.join(options.cache, `${code}.jpg`);

  try {
  switch (req.method) {
    case 'GET':
    try {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    } catch {
      console.log(`Image not found in cache. Downloading from https://http.cat/${code}...`);
      try {
        const response = await superagent
        .get(`https://http.cat/${code}`)
        .buffer(true);

        if (!response.headers['content-type'].startsWith('image/')) {
          throw new Error('Response is not an image');
        }

        const buffer = Buffer.from(response.body);
        await fs.writeFile(filePath, buffer);
        console.log(`Image ${code} saved to cache.`);

        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(buffer);
      } catch (err) {
        console.error('Error fetching image:', err.message);
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404: Image not found on http.cat');
      }
    }
    break;

  case 'PUT': {
    const body = [];
      for await (const chunk of req) body.push(chunk);
      const buffer = Buffer.concat(body);
      await fs.writeFile(filePath, buffer);
      res.writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('201: Image cached');
      break;
  }

  case 'DELETE':
        try {
          await fs.unlink(filePath);
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('200: Image removed');
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404: Image not found');
        }
        break;

      default:
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('405: Method Not Allowed');
  }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500: Server error — ' + err.message);
  }
});
server.listen(options.port, options.host, () => {
    console.log(`Server running: http://${options.host}:${options.port}/`);
});
