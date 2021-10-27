import amqp = require('amqplib/callback_api');
import { CompileRequest } from './messageTypes';
import WebSocketHandler from './websocketHandler';

export default class AmpqClient {
  private webSocketMap = new Map<any, WebSocketHandler>();

  private channel?: amqp.Channel = undefined;
  private queue?: string = undefined;

  constructor(url = 'amqp://rabbitmq') {
    amqp.connect(url, (err, connection) => {
      if (err) throw err;

      connection.createChannel((err1, channel) => {
        if (err1) throw err1;

        channel.assertQueue('', { exclusive: true }, (err2, q) => {
          if (err2) throw err2;

          this.channel = channel;
          this.queue = q.queue;

          channel.consume(
            q.queue,
            (msg: any) => {
              if (this.webSocketMap.has(msg.properties.correlationId)) {
                const ws = this.webSocketMap.get(
                  msg.properties.correlationId
                )!!;

                const data = JSON.parse(msg.content.toString());

                ws.handleAmqpMessage(data);
              }
            },
            { noAck: true }
          );
        });
      });
    });
  }

  requestCompile(from: WebSocketHandler, request: CompileRequest) {
    this.webSocketMap.set(from.id, from);

    this.channel?.sendToQueue('compile', Buffer.from(JSON.stringify(request)), {
      correlationId: from.id,
      replyTo: this.queue,
    });
  }

  send(from: WebSocketHandler, targetQueue: string, message: any) {
    this.channel?.sendToQueue(
      targetQueue,
      Buffer.from(JSON.stringify(message)),
      {
        correlationId: from.id,
        replyTo: this.queue,
      }
    );
  }

  webSocketClosed(from: WebSocketHandler, targetQueue: string) {
    this.send(from, targetQueue, { type: 'closed' });

    this.webSocketMap.delete(from.id);
  }
}
