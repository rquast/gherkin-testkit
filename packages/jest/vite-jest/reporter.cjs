
module.exports = class MyCustomReporter {
  async onRunComplete() {
    const viteServer = (await import('./vite-server.mjs')).default
    await viteServer.close()
  }
}
