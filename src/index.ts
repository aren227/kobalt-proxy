import AmpqClient from './amqpClient';
import { Server as WebSocketServer } from 'ws';
import WebSocketHandler from './websocketHandler';
import { config } from 'dotenv';

config({
  path:
    process.env.NODE_ENV === 'prod' ? '.env.production' : '.env.development',
});

const amqpClient = new AmpqClient(`amqp://${process.env.RABBITMQ_HOST}`);

const wsServer = new WebSocketServer({
  port: 8080,
});

wsServer.on('connection', (ws, req) => {
  new WebSocketHandler(ws, amqpClient);
});
