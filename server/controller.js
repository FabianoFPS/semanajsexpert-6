import { Service } from "./service.js";
import { logger } from "./util.js";

export class Controller {
  constructor() {
    this.service = new Service();
  }

  async getFileStream(fileName) {
    return this.service.getFileStream(fileName);
  }

  createClientStream() {
    const {
      id,
      clientStreams
    } = this.service.createFileStream();

    const onClose = () => {
      logger(`closing connection of ${id}`);
      this.service.removeClientStream(id);
    }

    return {
      stream: clientStreams,
      onClose,
    }
  }
}