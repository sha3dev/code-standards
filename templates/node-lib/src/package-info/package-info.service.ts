/**
 * @section imports:internals
 */

import config from "../config.ts";

/**
 * @section types
 */

export type PackageInfo = { packageName: string };

/**
 * @section class
 */

export class PackageInfoService {
  /**
   * @section private:attributes
   */

  private readonly packageName: string;

  /**
   * @section constructor
   */

  public constructor(packageName: string) {
    this.packageName = packageName;
  }

  /**
   * @section factory
   */

  public static createDefault(): PackageInfoService {
    return new PackageInfoService(config.PACKAGE_NAME);
  }

  /**
   * @section public:methods
   */

  public readPackageInfo(): PackageInfo {
    return { packageName: this.packageName };
  }
}
