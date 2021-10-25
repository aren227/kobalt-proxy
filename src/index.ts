import { request } from 'express';
import { createServer } from 'http';
import AmpqClient from './amqp_client';

const amqpClient = new AmpqClient();

createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/compile' && req.method === 'POST') {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      try {
        const msg = JSON.parse(data);
        if (!msg?.language || !msg?.code) throw Error('Invalid request');

        amqpClient.requestCompile(
          {
            language: msg.language as string,
            code: msg.code as string,
          },
          (result) => {
            res.writeHead(200, {
              'Content-Type': 'application/json',
            });
            console.log('result is', result);
            res.write;
            res.write(JSON.stringify(result));
            res.end();
          }
        );
      } catch {
        res.writeHead(400).end();
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(8080);
