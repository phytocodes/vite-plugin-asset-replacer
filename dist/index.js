// src/index.ts
import * as fs from "fs";
import * as path from "path";
var viteScssAssetReplacer = () => {
  let config;
  return {
    name: "vite-scss-asset-replacer",
    // configResolved の引数は ResolvedConfig 型
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    // transform の引数は code: string, id: string、戻り値は TransformResult | null
    transform(code, id) {
      if (!/\.(scss|sass|css)$/.test(id)) {
        return null;
      }
      let newCode = code;
      const urlRegex = /url\(['"]?([^'")]+\.(png|jpe?g|svg|gif|webp))['"]?\)/gi;
      newCode = newCode.replace(urlRegex, (match, assetPath) => {
        let targetPath = assetPath;
        targetPath = targetPath.replace(/\.webp/gi, "");
        const normalizedPath = targetPath.replace(/^(\.\.\/|\/)/, "");
        const absolutePath = path.resolve(config.publicDir, normalizedPath);
        if (!fs.existsSync(absolutePath)) {
          const ext = path.extname(normalizedPath);
          if (!ext) return match;
          const base = normalizedPath.slice(0, -ext.length);
          const retinaPath = `${base}@2x${ext}`;
          const absoluteRetinaPath = path.resolve(config.publicDir, retinaPath);
          if (fs.existsSync(absoluteRetinaPath)) {
            const prefix = assetPath.startsWith("/") ? "/" : assetPath.startsWith("../") ? "../" : "";
            targetPath = prefix + retinaPath;
          }
        }
        return `url("${targetPath}")`;
      });
      return {
        code: newCode
      };
    },
    // -------------------------------------------------------------
    // ビルド後の最終調整: 生成されたCSS内のパスを一括置換
    // -------------------------------------------------------------
    generateBundle(_, bundle) {
      if (config.command === "serve") return;
      for (const fileName in bundle) {
        const asset = bundle[fileName];
        if (asset.type === "asset" && fileName.endsWith(".css") && asset.source) {
          const source = asset.source.toString();
          const newSource = source.replace(/(?<!\.\.)\/images/g, "../images");
          if (newSource !== source) {
            asset.source = newSource;
            console.log(
              `\u2728 Path replacement complete: "/images" -> "../images" [${fileName}]`
            );
          }
        }
      }
    }
  };
};
var index_default = viteScssAssetReplacer;
export {
  index_default as default
};
