module.exports = { apps: [{ name: "{{packageName}}", script: "node", args: "--import tsx src/index.ts", env: { NODE_ENV: "production" } }] };
