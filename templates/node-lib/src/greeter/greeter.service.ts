/**
 * @section imports:externals
 */

/**
 * @section imports:internals
 */

import config from "../config.ts";
import LOGGER from "../logger.ts";

/**
 * @section consts
 */

const DEFAULT_SEPARATOR = ", ";

/**
 * @section types
 */

type GreeterServiceOptions = { greetingPrefix: string };

/**
 * @section public:properties
 */

export class GreeterService {
  private readonly greetingPrefix: string;

  /**
   * @section constructor
   */

  public constructor(options: GreeterServiceOptions) {
    this.greetingPrefix = options.greetingPrefix;
  }

  /**
   * @section factory
   */

  public static createDefault(): GreeterService {
    return new GreeterService({ greetingPrefix: config.GREETING_PREFIX });
  }

  /**
   * @section public:methods
   */

  public greet(name: string): string {
    const message = `${this.greetingPrefix}${DEFAULT_SEPARATOR}${name}`;
    LOGGER.debug(`greet called for ${name}`);
    return message;
  }
}
