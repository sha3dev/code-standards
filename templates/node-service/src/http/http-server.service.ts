/**
 * @section imports:externals
 */

import { createAdaptorServer } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";
import { Hono } from "hono";

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

  public buildServer(): ServerType {
    const app = new Hono();
    app.get("/", (context) => {
      const payload = this.appInfoService.buildPayload();
      context.header("content-type", config.RESPONSE_CONTENT_TYPE);
      return context.json(payload, 200);
    });
    const server = createAdaptorServer({ fetch: app.fetch });
    return server;
  }
}
