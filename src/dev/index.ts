import express from "express";
import http from "http";
import * as socketIO from "socket.io";

import middlewares from "./middlewares";

export interface DevServerSettings {
    port: number;
    bind: string;
    root: string;
    engine: "express" | "vite";
}

export function startDevServer(settings: DevServerSettings) {
    const ctx = createServerCtx(settings);

    if (settings.engine === "vite") {
        import('./vite').then((mod) => new mod.default(settings).start(ctx));
    } else {
        throw new Error(`Unsupported engine: ${settings.engine}`);
    }
}

export type Request = http.IncomingMessage;
export type Response = http.ServerResponse;
export type Next = () => unknown;
// eslint-disable-next-line no-unused-vars
export type RawMiddleware = (req: Request, res: Response, next: Next) => void | unknown;
export type RawHTTPServer = http.Server;
export type EnvContext = {
    server: RawHTTPServer,
    app: express.Application,
    io: socketIO.Server
}

function createServerCtx(settings: DevServerSettings): EnvContext {
    const app = express();
    for (const middleware of middlewares) {
        app.use(middleware);
    }

    const server = http.createServer(app);
    const io = new socketIO.Server(server);

    io.on("connection", (socket) => {
        console.log("[StarOverlay] Client connected:", socket.id);

        socket.on("auth", (token) => {
            if (token === "dev_server") {
                socket.emit("auth", {
                    widget: {},
                    template: {},
                    version: {}
                });
            } else {
                socket.emit("error", "BAD_AUTH");
                socket.disconnect();
            }
        });
    });

    const { port, bind } = settings;

    server.listen(port, bind, () => {
        console.log(`[StarOverlay] Dev server listening on http://${bind}:${port}/`);
    });

    return { server, app, io };
}