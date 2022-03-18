import fs from 'fs';
import { join, extname } from 'path';
import fsPromises from 'fs/promises';
import { randomUUID } from 'crypto';
import { PassThrough } from 'stream';

import config from './config.js';

export class Service {
  constructor() {
    this.clientStreams = new Map();
  }

  getClientStream() {
    const id = randomUUID();
    const clientStreams = new PassThrough();
    this.clientStreams.set(id, clientStreams);

    return {
      id,
      clientStreams
    }
  }

  removeClientStream(id) {
    this.clientStreams.delete(id);
  }

  createFileStream(filename) {
    return fs.createReadStream(filename);
  }

  async getFileInfo(file) {
    const fullFilePath = join(config.dir.publicDirectory, file);

    // valida se existe, se não existe estoura erro
    await fsPromises.access(fullFilePath);

    const fileType = extname(fullFilePath);

    return {
      type: fileType,
      name: fullFilePath,
    }
  }

  async getFileStream(file) {
    const { type, name } = await this.getFileInfo(file);

    return {
      stream: this.createFileStream(name),
      type,
    }
  }

}
