import type { ServerType } from "@hono/node-server";

/**
 * @section imports:internals
 */

import config from "../config.ts";
import { HttpServerService } from "../http/http-server.service.ts";
import logger from "../logger.ts";

/**
 * @section class
 */

export class ServiceRuntime {
  /**
   * @section private:attributes
   */

  private readonly httpServerService: HttpServerService;

  /**
   * @section constructor
   */

  public constructor(httpServerService: HttpServerService) {
    this.httpServerService = httpServerService;
  }

  /**
   * @section factory
   */

  public static createDefault(): ServiceRuntime {
    return new ServiceRuntime(HttpServerService.createDefault());
  }

  /**
   * @section public:methods
   */

  public buildServer(): ServerType {
    return this.httpServerService.buildServer();
  }

  public startServer(): ServerType {
    const server = this.buildServer();
    server.listen(config.DEFAULT_PORT, () => {
      logger.info(`service listening on http://localhost:${config.DEFAULT_PORT}`);
    });
    return server;
  }
}
