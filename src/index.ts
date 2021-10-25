import { createServer } from 'http';
import AmpqClient from './amqpClient';
import { createProxyServer } from 'http-proxy';
import { SessionMap } from './sessionMap';
import { CompileResultApiResponse } from './messageTypes';

const amqpClient = new AmpqClient();

const proxy = createProxyServer({ ws: true });

const sessionMap = new SessionMap();

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
            console.log(result);

            let response = {} as CompileResultApiResponse;

            if (
              result.result === 'success' &&
              result.session_id &&
              result.address
            ) {
              sessionMap.setAddress(result.session_id, result.address);

              response.result = 'success';
              response.session_id = result.session_id;
            } else {
              response.result = result.result;
            }

            res.writeHead(200, {
              'Content-Type': 'application/json',
            });
            res.write(JSON.stringify(response));
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
})
  .on('upgrade', (req, socket, head) => {
    if (req.url && req.url.startsWith('/') && req.url.length > 1) {
      const sessionId = req.url.substr(1);

      const address = sessionMap.getAddress(sessionId);

      if (address) {
        proxy.ws(req, socket, head, { target: address });

        sessionMap.removeAddress(sessionId);
      }
    }
  })
  .listen(8080);
