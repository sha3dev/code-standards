import path from "node:path";

import { writeJsonFile } from "../utils/fs.mjs";

export async function renderContractJson(targetDir, contract) {
  await writeJsonFile(path.join(targetDir, "ai", "contract.json"), contract);
}
