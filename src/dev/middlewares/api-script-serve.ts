import fs from "fs/promises";
import path from "path";
import { Next, RawMiddleware, Request, Response } from "..";

const SCRIPT_DOM_PATH = "/staroverlay.dom.js";

async function resolveNodeModulePath(...moduleName: string[]) {
    const root = path.join(process.cwd(), "node_modules", ...moduleName);
    const exists = await fs.stat(root).then(() => true).catch(() => false);
    if (exists) {
        return root;
    }

    const child = path.join(process.cwd(), "node_modules", "@staroverlay", "cli", "node_modules", ...moduleName);
    const childExists = await fs.stat(child).then(() => true).catch(() => false);
    if (childExists) {
        return child;
    }

    throw new Error(`Module ${moduleName.join("/")} not found`);
}

async function getScriptContent() {
    const dir = await resolveNodeModulePath("@staroverlay", "dom");
    const file = path.join(dir, "dist", "staroverlay.dom.js");
    const content = await fs.readFile(file, "utf-8");
    return content;
}

const middleware: RawMiddleware = async (req: Request, res: Response, next: Next) => {
    const path = req.url || "/";

    if (path == SCRIPT_DOM_PATH) {
        const content = await getScriptContent();

        res.statusCode = 200;
        res.setHeader("Content-Type", "text/js");
        res.write(content);
        res.end();
        return;
    }

    next();
};

export default middleware;