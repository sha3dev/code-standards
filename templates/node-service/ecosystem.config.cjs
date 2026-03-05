module.exports = { apps: [{ name: "{{packageName}}", script: "node", args: "--import tsx src/main.ts", env: { NODE_ENV: "production" } }] };
