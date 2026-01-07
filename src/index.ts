import * as fs from "node:fs";
import * as path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

/**
 * SCSS/SASS/CSSファイル内のアセットパスを処理するViteプラグイン
 * - .webp 拡張子の削除
 * - publicディレクトリ内に元のファイルが存在しない場合、@2xファイルに置換
 * - ビルド時、CSS内の「/images」パスを「../images」に強制置換
 */
const viteScssAssetReplacer = (): Plugin => {
  let config: ResolvedConfig;

  return {
    name: "vite-scss-asset-replacer",

    // configResolved の引数は ResolvedConfig 型
    configResolved(resolvedConfig: ResolvedConfig) {
      config = resolvedConfig;
    },

    // transform の引数は code: string, id: string、戻り値は TransformResult | null
    transform(code: string, id: string) {
      // SCSS/SASS/CSSファイルでのみ実行（ビルド時にも置換ルールを適用するため isServe 判定は除外）
      if (!/\.(scss|sass|css)$/.test(id)) {
        return null;
      }

      let newCode = code;

      // url(...) の中のパスを検索する正規表現（webpも対象に含める）
      const urlRegex = /url\(['"]?([^'")]+\.(png|jpe?g|svg|gif|webp))['"]?\)/gi;

      newCode = newCode.replace(urlRegex, (match, assetPath) => {
        let targetPath = assetPath;

        // 1. .webp の除去（url()内のみに限定）
        targetPath = targetPath.replace(/\.webp/gi, "");

        // 2. @2x ファイルへの置換ロジック
        // --- パスの正規化: publicDir からの相対パスを生成 ---
        const normalizedPath = targetPath.replace(/^(\.\.\/|\/)/, "");
        // 検索対象の絶対パス（publicDir 内）
        const absolutePath = path.resolve(config.publicDir, normalizedPath);

        // -------------------------------------------------------------
        // 元のファイルが存在するかどうかを publicDir のみでチェック
        // -------------------------------------------------------------
        if (!fs.existsSync(absolutePath)) {
          const ext = path.extname(normalizedPath);
          if (!ext) return match; // 拡張子がない場合はスキップ

          const base = normalizedPath.slice(0, -ext.length);
          // @2x のファイル名を作成
          const retinaPath = `${base}@2x${ext}`;
          // @2x ファイルの絶対パス（publicDir 内）
          const absoluteRetinaPath = path.resolve(config.publicDir, retinaPath);

          // -------------------------------------------------------------
          // @2x ファイルが publicDir 内に存在するかチェック
          // -------------------------------------------------------------
          if (fs.existsSync(absoluteRetinaPath)) {
            // 存在すれば、元のパス形式（/ か ../ か）を維持して置換
            const prefix = assetPath.startsWith("/")
              ? "/"
              : assetPath.startsWith("../")
              ? "../"
              : "";
            targetPath = prefix + retinaPath;
          }
        }

        // 最終的なパスを url("...") 形式で返す
        return `url("${targetPath}")`;
      });

      return {
        code: newCode,
      };
    },

    // -------------------------------------------------------------
    // ビルド後の最終調整: 生成されたCSS内のパスを一括置換
    // -------------------------------------------------------------
    generateBundle(_, bundle) {
      // 開発サーバー（serve）時は実行しない
      if (config.command === "serve") return;

      for (const fileName in bundle) {
        const asset = bundle[fileName];
        // CSSアセットかつソースが存在する場合のみ処理
        if (
          asset.type === "asset" &&
          fileName.endsWith(".css") &&
          asset.source
        ) {
          const source = asset.source.toString();

          // 「/images」を「../images」に変換（すでに ../ が付いているものは除外）
          const newSource = source.replace(/(?<!\.\.)\/images/g, "../images");

          // 内容に変更があった場合のみ、メモリ上のソースを上書き
          if (newSource !== source) {
            asset.source = newSource;
            console.log(
              `✨ Path replacement complete: "/images" -> "../images" [${fileName}]`
            );
          }
        }
      }
    },
  };
};

export default viteScssAssetReplacer;
