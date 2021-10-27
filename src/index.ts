import AmpqClient from './amqpClient';
import { Server as WebSocketServer } from 'ws';
import WebSocketHandler from './websocketHandler';

const amqpClient = new AmpqClient();

const wsServer = new WebSocketServer({
  port: 8080,
});

wsServer.on('connection', (ws, req) => {
  new WebSocketHandler(ws, amqpClient);
});
