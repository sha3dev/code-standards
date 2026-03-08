import { promptYesNo, withReadline } from "../utils/prompts.mjs";

const DEFAULTS = {
  publicApi: true,
  persistence: true,
  transport: true,
  configuration: true,
  runtimeBoundaries: true,
};

export function getDefaultPreservationDecisions() {
  return { ...DEFAULTS };
}

export async function resolvePreservationDecisions(rawOptions) {
  if (rawOptions.yes || !process.stdin.isTTY) {
    return getDefaultPreservationDecisions();
  }

  return withReadline(async (rl) => {
    const publicApi = await promptYesNo(rl, "Preserve public package contracts (exports, public names, observable types/shapes)?", DEFAULTS.publicApi);
    const persistence = await promptYesNo(rl, "Preserve persistence contracts (DB schema, migrations, table and column names)?", DEFAULTS.persistence);
    const transport = await promptYesNo(rl, "Preserve transport contracts (HTTP routes, status codes, message payloads)?", DEFAULTS.transport);
    const configuration = await promptYesNo(rl, "Preserve configuration contracts (env vars, config keys, config filenames)?", DEFAULTS.configuration);
    const runtimeBoundaries = await promptYesNo(
      rl,
      "Preserve runtime and package boundaries (ESM/CJS mode, bin scripts, exports map, build artifacts)?",
      DEFAULTS.runtimeBoundaries,
    );

    return { publicApi, persistence, transport, configuration, runtimeBoundaries };
  });
}
