import { once } from 'events';

import config from "./config.js";
import { Controller } from "./controller.js";
import { logger } from "./util.js"

const controller = new Controller();

async function routes(request, response) {
  const { method, url } = request;

  if (method === 'GET' && url === '/') {
    response.writeHead(302, {
      'Location': config.location.home,
    });

    return response.end();
  }

  if (method === 'GET' && url === '/home') {
    const {
      stream
    } = await controller.getFileStream(config.pages.homeHTML);

    return stream.pipe(response);
  }

  if (method === 'GET' && url === '/controller') {
    const {
      stream
    } = await controller.getFileStream(config.pages.controllerHTML);

    return stream.pipe(response);
  }

  if (method === 'GET' && url.includes('/stream')) {
    const {
      stream,
      onClose
    } = controller.createClientStream();

    request.once('close', onClose);

    response.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Accept-Rages': 'bytes'
    });

    return stream.pipe(response);
  }

  if (method === 'POST' && url.includes('/controller')) {
    const data = await once(request, 'data');
    const item = JSON.parse(data);
    const result = await controller.handleCommand(item);
    return response.end(JSON.stringify(result));
  }

  if (method === 'GET') {
    const {
      stream,
      type
    } = await controller.getFileStream(url);

    config.constants.CONTENT_TYPES[type]
      && response.writeHead(200, {
        'Content-Type': config.constants.CONTENT_TYPES[type]
      });

    return stream.pipe(response);
  }

  response.writeHead(404);
  return response.end();
}

function handleError(error, response) {
  if (error.message.includes('ENOENT')) {
    logger.warn(`asset not found ${error.stack}`);
    response.writeHead(404);
    return response.end();
  }

  logger.error(`caught error on API ${error.stack}`);
  response.writeHead(500);
  return response.end();
}

export function handler(request, response) {
  return routes(request, response)
    .catch(error => handleError(error, response));
}