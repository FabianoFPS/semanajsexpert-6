import fs from 'fs';
import { join, extname } from 'path';
import fsPromises from 'fs/promises';

import config from './config.js';

export class Service {
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
