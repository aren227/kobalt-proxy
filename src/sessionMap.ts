export class SessionMap {
  private map = new Map<string, string>();

  getAddress(sessionId: string) {
    return this.map.get(sessionId);
  }

  setAddress(sessionId: string, address: string) {
    this.map.set(sessionId, address);
  }

  removeAddress(sessionId: string) {
    this.map.delete(sessionId);
  }
}
