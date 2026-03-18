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
 * @section class
 */

export class HttpServerService {
  /**
   * @section private:attributes
   */

  private readonly appInfoService: AppInfoService;

  /**
   * @section constructor
   */

  public constructor(appInfoService: AppInfoService) {
    this.appInfoService = appInfoService;
  }

  /**
   * @section factory
   */

  public static createDefault(): HttpServerService {
    return new HttpServerService(AppInfoService.createDefault());
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
    return createAdaptorServer({ fetch: app.fetch });
  }
}
