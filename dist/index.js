// src/index.ts
import * as fs from "fs";
import * as path from "path";
var viteScssAssetReplacer = () => {
  let isServe = false;
  let publicDir = "";
  return {
    name: "vite-scss-asset-replacer",
    // configResolved の引数は ResolvedConfig 型
    configResolved(config) {
      isServe = config.command === "serve";
      publicDir = config.publicDir;
    },
    // transform の引数は code: string, id: string、戻り値は TransformResult | null
    transform(code, id) {
      if (!isServe || !/\.(scss|sass)$/.test(id)) {
        return null;
      }
      let newCode = code;
      newCode = newCode.replace(/\.webp/gi, "");
      const urlRegex = /url\(['"]?([^'")]+\.(png|jpe?g|svg|gif))['"]?\)/gi;
      newCode = newCode.replace(urlRegex, (match, assetPath) => {
        const normalizedAssetPath = assetPath.replace(/^\.\.\//, "").replace(/^\//, "");
        const absoluteAssetPath = path.resolve(publicDir, normalizedAssetPath);
        if (!fs.existsSync(absoluteAssetPath)) {
          const lastDotIndex = normalizedAssetPath.lastIndexOf(".");
          if (lastDotIndex === -1) {
            return match;
          }
          const baseName = normalizedAssetPath.substring(0, lastDotIndex);
          const ext = normalizedAssetPath.substring(lastDotIndex);
          const retinaFileName = `${baseName}@2x${ext}`;
          const absoluteRetinaAssetPath = path.resolve(publicDir, retinaFileName);
          if (fs.existsSync(absoluteRetinaAssetPath)) {
            let newAssetPath = retinaFileName;
            if (assetPath.startsWith("/")) {
              newAssetPath = `/${retinaFileName}`;
            } else if (assetPath.startsWith("../")) {
              newAssetPath = `../${retinaFileName}`;
            }
            const newMatch = match.replace(assetPath, newAssetPath);
            return newMatch;
          }
        }
        return match;
      });
      return {
        code: newCode
      };
    }
  };
};
var index_default = viteScssAssetReplacer;
export {
  index_default as default
};
