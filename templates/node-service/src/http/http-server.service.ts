/**
 * @section imports:externals
 */

import { createServer } from "node:http";

/**
 * @section imports:internals
 */

import config from "../config.ts";
import { StatusService } from "../status/status.service.ts";

/**
 * @section consts
 */

/**
 * @section types
 */

type HttpServerServiceOptions = { statusService: StatusService };

/**
 * @section public:properties
 */

export class HttpServerService {
  private readonly statusService: StatusService;

  /**
   * @section constructor
   */

  public constructor(options: HttpServerServiceOptions) {
    this.statusService = options.statusService;
  }

  /**
   * @section factory
   */

  public static createDefault(): HttpServerService {
    return new HttpServerService({ statusService: StatusService.createDefault() });
  }

  /**
   * @section public:methods
   */

  public buildServer() {
    const server = createServer((_, response) => {
      const payload = this.statusService.buildPayload();
      response.statusCode = 200;
      response.setHeader("content-type", config.RESPONSE_CONTENT_TYPE);
      response.end(JSON.stringify(payload));
    });

    return server;
  }
}
