import { createServer } from 'http';
import AmpqClient from './amqp_client';

const amqpClient = new AmpqClient();

createServer((req, res) => {
  if (req.url === '/compile' && req.method === 'GET') {
    amqpClient.requestCompile((result) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify(result));
      res.end();
    });
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(8080);
