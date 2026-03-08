/**
 * @section imports:externals
 */

import { createServer } from "node:http";

/**
 * @section imports:internals
 */

import { AppInfoService } from "../app-info/app-info.service.ts";
import config from "../config.ts";

/**
 * @section types
 */

type HttpServerServiceOptions = { appInfoService: AppInfoService };

/**
 * @section public:properties
 */

export class HttpServerService {
  private readonly appInfoService: AppInfoService;

  /**
   * @section constructor
   */

  public constructor(options: HttpServerServiceOptions) {
    this.appInfoService = options.appInfoService;
  }

  /**
   * @section factory
   */

  public static createDefault(): HttpServerService {
    return new HttpServerService({ appInfoService: AppInfoService.createDefault() });
  }

  /**
   * @section public:methods
   */

  public buildServer() {
    const server = createServer((_, response) => {
      const payload = this.appInfoService.buildPayload();
      response.statusCode = 200;
      response.setHeader("content-type", config.RESPONSE_CONTENT_TYPE);
      response.end(JSON.stringify(payload));
    });

    return server;
  }
}
