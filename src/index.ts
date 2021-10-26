import express from 'express';
import cors from 'cors';
import AmpqClient from './amqpClient';
import { createProxyServer } from 'http-proxy';
import { SessionMap } from './sessionMap';
import { CompileResultApiResponse } from './messageTypes';

const amqpClient = new AmpqClient();

const proxy = createProxyServer({ ws: true });

const sessionMap = new SessionMap();

const app = express();

app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.post('/compile', (req, res) => {
  const msg = req.body;
  console.log(msg);
  if (!msg?.language || !msg?.code) {
    res.status(400).json({ result: 'invalid_request' });
    return;
  }

  amqpClient.requestCompile(
    {
      language: msg.language as string,
      code: msg.code as string,
    },
    (result) => {
      console.log(result);

      if (result.result === 'success' && result.session_id && result.address) {
        sessionMap.setAddress(result.session_id, result.address);
      }

      const { address, ...response } = result;

      res.json(response);
    }
  );
});

const server = app.listen(8080);

server.on('upgrade', (req, socket, head) => {
  if (req.url && req.url.startsWith('/') && req.url.length > 1) {
    const sessionId = req.url.substr(1);

    const address = sessionMap.getAddress(sessionId);

    if (address) {
      proxy.ws(req, socket, head, { target: address });

      sessionMap.removeAddress(sessionId);
    }
  }
});
