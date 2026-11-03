// Node module hooks so CLI scripts can import app code the same way Next.js does:
// resolves "@/..." to the project root, adds the ".js" extension and "/index.js"
// that Next allows you to omit, and loads project .js files as ES modules.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectUrl = pathToFileURL(projectRoot + path.sep).href;

export async function resolve(specifier, context, nextResolve) {
  const target = specifier.startsWith("@/")
    ? pathToFileURL(path.join(projectRoot, specifier.slice(2))).href
    : specifier;

  try {
    return await nextResolve(target, context);
  } catch (error) {
    if (target.endsWith(".js")) throw error;
    const isFileLike = target.startsWith("file:") || target.startsWith(".");
    // Package subpaths without an "exports" map, e.g. "next/server" -> "next/server.js".
    const isPackageSubpath = !isFileLike && target.includes("/") && !target.startsWith("node:");
    if (error.code === "ERR_MODULE_NOT_FOUND" && (isFileLike || isPackageSubpath)) {
      return nextResolve(`${target}.js`, context);
    }
    if (isFileLike && error.code === "ERR_UNSUPPORTED_DIR_IMPORT") return nextResolve(`${target}/index.js`, context);
    throw error;
  }
}

export async function load(url, context, nextLoad) {
  const isProjectSource =
    url.startsWith(projectUrl) && url.endsWith(".js") && !url.includes("/node_modules/");
  return nextLoad(url, isProjectSource ? { ...context, format: "module" } : context);
}
