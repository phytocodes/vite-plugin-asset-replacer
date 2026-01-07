import { Plugin } from 'vite';

/**
 * SCSS/SASS/CSSファイル内のアセットパスを処理するViteプラグイン
 * - 開発時のみ: .webp 拡張子の削除
 * - 共通: publicディレクトリ内に元のファイルが存在しない場合、@2xファイルに置換
 * - ビルド時のみ: CSS内の「/images」パスを「../images」に強制置換
 */
declare const viteScssAssetReplacer: () => Plugin;

export { viteScssAssetReplacer as default };
