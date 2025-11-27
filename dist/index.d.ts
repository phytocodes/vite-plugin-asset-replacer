import { Plugin } from 'vite';

/**
 * SCSS/SASSファイル内のアセットパスを処理するViteプラグイン
 * - .webp 拡張子の削除
 * - publicディレクトリ内に元のファイルが存在しない場合、@2xファイルに置換
 */
declare const viteScssAssetReplacer: () => Plugin;

export { viteScssAssetReplacer as default };
