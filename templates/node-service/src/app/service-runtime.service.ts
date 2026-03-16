import type { ServerType } from "@hono/node-server";

/**
 * @section imports:internals
 */

import config from "../config.ts";
import { HttpServerService } from "../http/http-server.service.ts";
import logger from "../logger.ts";

/**
 * @section types
 */

type ServiceRuntimeOptions = { httpServerService: HttpServerService };

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

  public constructor(options: ServiceRuntimeOptions) {
    this.httpServerService = options.httpServerService;
  }

  /**
   * @section factory
   */

  public static createDefault(): ServiceRuntime {
    return new ServiceRuntime({ httpServerService: HttpServerService.createDefault() });
  }

  /**
   * @section public:methods
   */

  public buildServer(): ServerType {
    const server = this.httpServerService.buildServer();
    return server;
  }

  public startServer(): ServerType {
    const server = this.buildServer();
    server.listen(config.DEFAULT_PORT, () => {
      logger.info(`service listening on http://localhost:${config.DEFAULT_PORT}`);
    });
    return server;
  }
}
