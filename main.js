const { Command } = require('commander');
const http = require('http');
const fs = require('fs');
const path = require('path');

const program = new Command();
program
    .option('-h, --host <host>', 'server host (e.g. localhost)')
    .option('-p, --port <number>', 'server port (e.g. 3000')
    .option('-c, --cache <cacheDir>', 'cache directory path');

program.parse(process.argv);
const options = program.opts();

if(!fs.existsSync(options.cache)){
    fs.mkdirSync(options.cache, {recursive: true});
    console.log(`Cache folder created: ${options.cache}`); 
}

if (!options.host || !options.port || !options.cache){
    console.error('Error: missing required parameters (--host, --port, --cache)')
    process.exit(1);
}
const server = http.createServer(async (req, res) => {
  const code = req.url.slice(1);
  const filePath = path.join(options.cache, `${code}.jpg`);

  if (req.method === 'GET') {
    try {
      const data = await fs.promises.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404: Image not found in cache');
    }
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('405: Method Not Allowed');
  }
});
server.listen(options.port, options.host, () => {
    console.log(`Server running: http://${options.host}:${options.port}/`);
});