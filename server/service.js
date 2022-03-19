import fs from 'fs';
import { join, extname } from 'path';
import fsPromises from 'fs/promises';
import { randomUUID } from 'crypto';
import { PassThrough, Writable } from 'stream';
import Throttle from 'throttle';
import ChildProcess from 'child_process';
import streamsPromises from 'stream/promises';
import { once } from 'events';

import config from './config.js';
import { logger } from './util.js';

export class Service {
  constructor() {
    this.clientStreams = new Map();
    this.currentSong = config.constants.englishConversation;
    this.currentBitrate = 0;
    this.throttleTransform = {};
    this.currentReadable = {};
  }

  createClientStream() {
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

  _executeSoxStream(args) {
    return ChildProcess.spawn('sox', args)
  }

  async getBitRate(song) {
    try {
      const args = [
        '--i',
        '-B',
        song
      ];

      const {
        stderr, // tudo oque é erro
        stdout, // tudo oque é log
        // stdin, // enviar dados como stream
      } = this._executeSoxStream(args);

      await Promise.all([
        once(stderr, 'readable'),
        once(stdout, 'readable'),
      ])

      const [success, error] = [stdout, stderr].map(stream => stream.read());

      if (error) return await Promise.reject(error);

      return success
        .toString()
        .trim()
        .replace(/k/, '000');
    } catch (error) {
      logger.error(`Erro: ${error}`);
      return config.constants.fallbackBitRate;
    }
  }

  broadCast() {
    return new Writable({
      write: (chunk, enc, cb) => {
        for (const [key, stream] of this.clientStreams) {
          if (stream.writableEnd) {
            this.clientStreams.delete(key);
            continue;
          }

          stream.write(chunk);
        }

        cb();
      }
    });
  }

  async startStreamming() {
    logger.info(`Start with ${this.currentSong}`);
    const bitRate = this.currentBitrate
      = (
        await this.getBitRate(this.currentSong)
      ) / config.constants.bitRateDivisor;

    const throttleTransform = this.throttleTransform = new Throttle(bitRate);
    const songReadable = this.currentReadable = this.createFileStream(this.currentSong);

    streamsPromises.pipeline(
      songReadable,
      throttleTransform,
      this.broadCast()
    )
  }

  stopStreamming() {
    this.throttleTransform?.end?.();
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
