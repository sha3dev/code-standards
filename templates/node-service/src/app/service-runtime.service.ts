/**
 * @section imports:internals
 */

import config from "../config.ts";
import { HttpServerService } from "../http/http-server.service.ts";
import LOGGER from "../logger.ts";

/**
 * @section types
 */

type ServiceRuntimeOptions = { httpServerService: HttpServerService };

/**
 * @section public:properties
 */

export class ServiceRuntime {
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

  public buildServer() {
    const server = this.httpServerService.buildServer();
    return server;
  }

  public startServer() {
    const server = this.buildServer();
    server.listen(config.DEFAULT_PORT, () => {
      LOGGER.info(`service listening on http://localhost:${config.DEFAULT_PORT}`);
    });
    return server;
  }
}
