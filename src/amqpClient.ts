import amqp = require('amqplib/callback_api');
import { v4 } from 'uuid';
import { CompileRequest, CompileResult } from './messageTypes';

export default class AmpqClient {
  private channel?: amqp.Channel = undefined;
  private queue?: string = undefined;

  private pendingRequests: Map<string, (result: CompileResult) => void> =
    new Map();

  constructor(url = 'amqp://rabbitmq') {
    this.pendingRequests = new Map();

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
              if (this.pendingRequests.has(msg.properties.correlationId)) {
                const callback = this.pendingRequests.get(
                  msg.properties.correlationId
                )!!;
                this.pendingRequests.delete(msg.properties.correlationId);

                callback(JSON.parse(msg.content.toString()));
              }
            },
            { noAck: true }
          );
        });
      });
    });
  }

  requestCompile(
    request: CompileRequest,
    callback: (result: CompileResult) => void
  ) {
    const uuid = v4();

    this.channel?.sendToQueue('compile', Buffer.from(JSON.stringify(request)), {
      correlationId: uuid,
      replyTo: this.queue,
    });
    this.pendingRequests.set(uuid, callback);
  }
}
