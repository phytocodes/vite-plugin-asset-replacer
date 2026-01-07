import { Plugin } from 'vite';

/**
 * SCSS/SASS/CSSファイル内のアセットパスを処理するViteプラグイン
 * - .webp 拡張子の削除
 * - publicディレクトリ内に元のファイルが存在しない場合、@2xファイルに置換
 * - ビルド時、CSS内の「/images」パスを「../images」に強制置換
 */
declare const viteScssAssetReplacer: () => Plugin;

export { viteScssAssetReplacer as default };
