import { jest, expect, describe, test, beforeEach } from '@jest/globals';

import config from '../../../server/config.js';
import { Controller } from '../../../server/controller.js';
import { handler } from '../../../server/routes.js';
import TestUtil from '../util/testUtil.js';


const { pages, location } = config;

describe('#Routes - test site for api response', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('GET / - should redirect to home page', async () => {
    const { request, response } = TestUtil.defaultHandleParams();
    request.method = 'GET';
    request.url = '/';

    await handler(request, response);

    expect(response.writeHead).toBeCalledWith(
      302,
      {
        Location: location.home
      }
    );
    expect(response.end).toBeCalled();
  });

  test(`GET /home - should response with ${pages.homeHTML} file stream`, async () => {
    const { request, response } = TestUtil.defaultHandleParams();
    request.method = 'GET';
    request.url = '/home';

    const mockFileStream = TestUtil.generateReadableStream(['data']);

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValueOnce({
      stream: mockFileStream
    });

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue();

    await handler(request, response);

    expect(Controller.prototype.getFileStream).toBeCalledWith(pages.homeHTML);
    expect(mockFileStream.pipe).toBeCalledWith(response);
  });

  test(`GET /controller - should response with ${pages.controllerHTML} file stream`, async () => {
    const { request, response } = TestUtil.defaultHandleParams();
    request.method = 'GET';
    request.url = '/controller';

    const mockFileStream = TestUtil.generateReadableStream(['data']);

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValueOnce({
      stream: mockFileStream
    });

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue();

    await handler(request, response);

    expect(Controller.prototype.getFileStream).toBeCalledWith(pages.controllerHTML);
    expect(mockFileStream.pipe).toBeCalledWith(response);
  });

  test(`GET /index.html - should response with file stream`, async () => {
    const { request, response } = TestUtil.defaultHandleParams();
    const fileName = '/index.html';

    request.method = 'GET';
    request.url = fileName;

    const mockFileStream = TestUtil.generateReadableStream(['data']);

    const expectType = '.html';

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValueOnce({
      stream: mockFileStream,
      type: expectType,
    });

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue();

    await handler(request, response);

    expect(Controller.prototype.getFileStream).toBeCalledWith(fileName);
    expect(mockFileStream.pipe).toBeCalledWith(response);
    expect(response.writeHead).toHaveBeenCalledWith(
      200,
      {
        'Content-Type': config.constants.CONTENT_TYPES[expectType]
      }
    );
  });

  test(`GET /file.ext - should response with file stream`, async () => {
    const { request, response } = TestUtil.defaultHandleParams();
    const fileName = '/file.ext';

    request.method = 'GET';
    request.url = fileName;

    const mockFileStream = TestUtil.generateReadableStream(['data']);

    const expectType = '.ext';

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValueOnce({
      stream: mockFileStream,
      type: expectType,
    });

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue();

    await handler(request, response);

    expect(Controller.prototype.getFileStream).toBeCalledWith(fileName);
    expect(mockFileStream.pipe).toBeCalledWith(response);
    expect(response.writeHead).not.toHaveBeenCalled();
  });


  test(`POST /unknown - given an inexistent route it should response with 404`, async () => {
    const { request, response } = TestUtil.defaultHandleParams();

    request.method = 'POST';
    request.url = '/unknown';

    await handler(request, response);

    expect(response.writeHead).toHaveBeenCalledWith(404);
    expect(response.end).toHaveBeenCalled();
  });

  describe('exception', () => {
    test('given inexistent file it should response with 404', async () => {
      const { request, response } = TestUtil.defaultHandleParams();

      request.method = 'GET';
      request.url = '/index.png';

      jest.spyOn(
        Controller.prototype,
        Controller.prototype.getFileStream.name
      ).mockRejectedValue(new Error('Error: ENOENT: ...'));

      await handler(request, response);

      expect(response.writeHead).toHaveBeenCalledWith(404);
      expect(response.end).toHaveBeenCalled();
    });

    test('given an error it should response with 500', async () => {
      const { request, response } = TestUtil.defaultHandleParams();

      request.method = 'GET';
      request.url = '/index.png';

      jest.spyOn(
        Controller.prototype,
        Controller.prototype.getFileStream.name
      ).mockRejectedValue(new Error('Error:'));

      await handler(request, response);

      expect(response.writeHead).toHaveBeenCalledWith(500);
      expect(response.end).toHaveBeenCalled();
    });
  })
});