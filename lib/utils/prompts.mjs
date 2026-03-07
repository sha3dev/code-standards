import readline from "node:readline/promises";

export async function askChoice(rl, prompt, options, defaultValue) {
  const defaultIndex = options.indexOf(defaultValue);

  if (defaultIndex < 0) {
    throw new Error(`Invalid default value for question ${prompt}`);
  }

  console.log(`\n${prompt}`);

  for (let index = 0; index < options.length; index += 1) {
    console.log(`  ${index + 1}) ${options[index]}`);
  }

  const answer = await rl.question(`Select option [${defaultIndex + 1}]: `);
  const normalized = answer.trim();

  if (normalized.length === 0) {
    return defaultValue;
  }

  const numeric = Number.parseInt(normalized, 10);

  if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= options.length) {
    return options[numeric - 1];
  }

  if (options.includes(normalized)) {
    return normalized;
  }

  throw new Error(`Invalid option for ${prompt}: ${answer}`);
}

export async function promptYesNo(rl, prompt, defaultYes = true) {
  const suffix = defaultYes ? "[Y/n]" : "[y/N]";
  const answer = (await rl.question(`${prompt} ${suffix}: `)).trim().toLowerCase();

  if (answer.length === 0) {
    return defaultYes;
  }

  if (answer === "y" || answer === "yes") {
    return true;
  }

  if (answer === "n" || answer === "no") {
    return false;
  }

  throw new Error(`Invalid yes/no answer: ${answer}`);
}

export async function withReadline(action) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    return await action(rl);
  } finally {
    rl.close();
  }
}
