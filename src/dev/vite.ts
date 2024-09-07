import fs from "fs/promises";
import * as path from "path";
import { createServer, ViteDevServer } from "vite";

import { DevServerSettings, EnvContext } from ".";

export default class DevServer {
    private readonly options: DevServerSettings;
    private vite: ViteDevServer | null;

     constructor(options: DevServerSettings) {
        this.options = options;
        this.vite = null;
    }

    async start(ctx: EnvContext) {
        const vite = await createServer({
            configFile: false,
            root: this.options.root,
            server: {
                middlewareMode: {
                    server: ctx.server
                }
            },
            appType: "custom"
        });

        ctx.app.use(vite.middlewares);

        ctx.app.get("*", async (req, res, next) => {
            const url = req.originalUrl;

            try {
                // 1. Read index.html
                const template = await fs.readFile(
                  path.resolve(this.options.root, 'index.html'),
                  'utf-8',
                );

                const page = `
                    <!doctype html>
                    <html lang="en">
                        <head>
                            <meta charset="UTF-8" />
                            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                            <title>StarOverlay | Dev Server</title>
                            <script src="/staroverlay.dom.js"></script>
                        </head>

                        <body>
                            <div id="app">${template}</div>

                            <script>
                                injectLibDOM({
                                    backendURL: undefined,
                                    workerURL: "/worker",
                                    widgetToken: "dev_server",
                                });
                            </script>
                        </body>
                    </html>
                `;
            
                // 2. Apply Vite HTML transforms. This injects the Vite HMR client,
                //    and also applies HTML transforms from Vite plugins, e.g. global
                //    preambles from @vitejs/plugin-react
                const result = await vite.transformIndexHtml(url, page);
            
                // 6. Send the rendered HTML back.
                res.status(200).set({ 'Content-Type': 'text/html' }).end(result);
              } catch (e) {
                const error = e as Error;
                // If an error is caught, let Vite fix the stack trace so it maps back
                // to your actual source code.
                vite.ssrFixStacktrace(error);
                next(error);
              }
        });

        this.vite = vite;
    }

    stop() {
        this.vite?.close();
    }
}