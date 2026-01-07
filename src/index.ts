import * as fs from "node:fs";
import * as path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

/**
 * SCSS/SASS/CSSファイル内のアセットパスを処理するViteプラグイン
 * - 開発時のみ: .webp 拡張子の削除
 * - 共通: publicディレクトリ内に元のファイルが存在しない場合、@2xファイルに置換
 * - ビルド時のみ: CSS内の「/images」パスを「../images」に強制置換
 */
const viteScssAssetReplacer = (): Plugin => {
  let config: ResolvedConfig;

  return {
    name: "vite-scss-asset-replacer",

    configResolved(resolvedConfig: ResolvedConfig) {
      config = resolvedConfig;
    },

    transform(code: string, id: string) {
      if (!/\.(scss|sass|css)$/.test(id)) {
        return null;
      }

      let newCode = code;
      const urlRegex = /url\(['"]?([^'")]+\.(png|jpe?g|svg|gif|webp))['"]?\)/gi;

      newCode = newCode.replace(urlRegex, (match, assetPath) => {
        let targetPath = assetPath;

        // 1. .webp の除去
        // 開発サーバー時（serve）のみ実行し、ビルド時は WebP を維持する
        if (config.command === "serve") {
          targetPath = targetPath.replace(/\.webp/gi, "");
        }

        // 2. @2x ファイルへの置換ロジック
        const normalizedPath = targetPath.replace(/^(\.\.\/|\/)/, "");
        const absolutePath = path.resolve(config.publicDir, normalizedPath);

        if (!fs.existsSync(absolutePath)) {
          const ext = path.extname(normalizedPath);
          if (!ext) return match;

          const base = normalizedPath.slice(0, -ext.length);
          const retinaPath = `${base}@2x${ext}`;
          const absoluteRetinaPath = path.resolve(config.publicDir, retinaPath);

          if (fs.existsSync(absoluteRetinaPath)) {
            const prefix = assetPath.startsWith("/")
              ? "/"
              : assetPath.startsWith("../")
              ? "../"
              : "";
            targetPath = prefix + retinaPath;
          }
        }

        // クォーテーションを付けて返す
        return `url("${targetPath}")`;
      });

      return { code: newCode };
    },

    generateBundle(_, bundle) {
      // ビルド時のみ最終的なパス置換を実行
      if (config.command === "serve") return;

      for (const fileName in bundle) {
        const asset = bundle[fileName];
        if (
          asset.type === "asset" &&
          fileName.endsWith(".css") &&
          asset.source
        ) {
          const source = asset.source.toString();

          // 「/images」を「../images」に変換
          const newSource = source.replace(/(?<!\.\.)\/images/g, "../images");

          if (newSource !== source) {
            asset.source = newSource;
            console.log(
              `✨ Asset paths converted to relative (../images) in: ${fileName}`
            );
          }
        }
      }
    },
  };
};

export default viteScssAssetReplacer;
