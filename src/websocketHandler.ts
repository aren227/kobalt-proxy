import { WebSocket } from 'ws';
import AmpqClient from './amqpClient';
import { v4 } from 'uuid';

export default class WebSocketHandler {
  id = v4();
  private ws: WebSocket;
  private amqpClient: AmpqClient;

  private connectedQueue?: string;

  private closed = false;

  constructor(ws: WebSocket, amqpClient: AmpqClient) {
    this.ws = ws;
    this.amqpClient = amqpClient;

    this.ws.on('message', (data) => {
      this.handleWebSocketMessage(JSON.parse(data.toString()));
    });

    this.ws.onclose = (e) => {
      this.close();
    };
  }

  private close() {
    if (this.closed) return;
    this.closed = true;

    this.ws.close();

    if (this.connectedQueue) {
      this.amqpClient.webSocketClosed(this, this.connectedQueue);
    }
  }

  handleAmqpMessage(message: any) {
    if (message.type === 'compile_success') {
      this.connectedQueue = message.queue;
      this.ws.send(JSON.stringify({ type: 'compile_success' }));
    } else if (message.type === 'closed') {
      this.close();
    } else {
      // Just forward received message
      this.ws.send(JSON.stringify(message));
    }

    // WebSocket closed during compile stage
    // Manually close worker session
    if (this.connectedQueue && this.closed) {
      this.amqpClient.webSocketClosed(this, this.connectedQueue);
    }
  }

  private handleWebSocketMessage(msg: any) {
    if (!this.connectedQueue) {
      if (msg.type === 'compile') {
        const language = msg.language;
        const code = msg.code;

        this.amqpClient.requestCompile(this, { language, code });
      }
    } else {
      // Just forward received message
      this.amqpClient.send(this, this.connectedQueue, msg);
    }
  }
}
