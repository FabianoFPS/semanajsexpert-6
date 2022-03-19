import { Service } from "./service.js";
import { logger } from "./util.js";

export class Controller {
  constructor() {
    this.service = new Service();
  }

  async getFileStream(fileName) {
    return this.service.getFileStream(fileName);
  }

  /** 
   * @param {string} command - JSDoc
  */
  async handleCommand({ command }) {
    logger.info(`command received: ${command}`);

    const result = {
      result: 'ok',
    };
    
    const cmd = command.toLowerCase();
    if(cmd.includes('start')) {
      this.service.startStreamming();
      return result;
    }

    if(cmd.includes('stop')){
      this.service.stopStreamming();
      return result;
    }
  }

  createClientStream() {
    const {
      id,
      clientStreams
    } = this.service.createClientStream();

    const onClose = () => {
      logger.info(`closing connection of ${id}`);
      this.service.removeClientStream(id);
    }

    return {
      stream: clientStreams,
      onClose,
    }
  }
}