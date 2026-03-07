/**
 * @section imports:externals
 */

/**
 * @section imports:internals
 */

import config from "../config.ts";

/**
 * @section consts
 */

/**
 * @section types
 */

export type ServiceStatusPayload = { ok: true; statusSource: string };

/**
 * @section public:properties
 */

export class StatusService {
  private readonly externalStatusUrl: string;

  /**
   * @section constructor
   */

  public constructor(options: { externalStatusUrl: string }) {
    this.externalStatusUrl = options.externalStatusUrl;
  }

  /**
   * @section factory
   */

  public static createDefault(): StatusService {
    return new StatusService({ externalStatusUrl: config.EXTERNAL_STATUS_URL });
  }

  /**
   * @section public:methods
   */

  public buildPayload(): ServiceStatusPayload {
    const payload: ServiceStatusPayload = { ok: true, statusSource: this.externalStatusUrl };
    return payload;
  }
}
