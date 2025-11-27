import * as fs from 'fs';
import * as path from 'path';
import { Plugin, ResolvedConfig } from 'vite';

/**
 * SCSS/SASSファイル内のアセットパスを処理するViteプラグイン
 * - .webp 拡張子の削除
 * - publicディレクトリ内に元のファイルが存在しない場合、@2xファイルに置換
 */
const viteScssAssetReplacer = (): Plugin => {
	let isServe: boolean = false;
	// publicDir は絶対パス文字列として取得されます
	let publicDir: string = '';

	return {
		name: 'vite-scss-asset-replacer',

		// configResolved の引数は ResolvedConfig 型
		configResolved(config: ResolvedConfig) {
			isServe = config.command === 'serve';
			publicDir = config.publicDir;
		},

		// transform の引数は code: string, id: string、戻り値は TransformResult | null
		transform(code: string, id: string) {
			// 開発サーバー時かつSCSS/SASSファイルでのみ実行
			if (!isServe || !/\.(scss|sass)$/.test(id)) {
				return null;
			}

			let newCode = code;
			// 1. .webp の削除
			newCode = newCode.replace(/\.webp/gi, '');

			// 2. @2x ファイルへの置換ロジック
			// url(...) の中のパスを検索する正規表現
			const urlRegex = /url\(['"]?([^'")]+\.(png|jpe?g|svg|gif))['"]?\)/gi;

			newCode = newCode.replace(urlRegex, (match, assetPath) => {
				// assetPath の型は TypeScript によって string と推論されます

				// --- パスの正規化: publicDir からの相対パスを生成 ---
				const normalizedAssetPath = assetPath
						.replace(/^\.\.\//, '') // '../' を削除
						.replace(/^\//, '');     // '/' を削除

				// 検索対象の絶対パス（publicDir 内）
				const absoluteAssetPath = path.resolve(publicDir, normalizedAssetPath);

				// -------------------------------------------------------------
				// 元のファイルが存在するかどうかを publicDir のみでチェック
				// -------------------------------------------------------------
				if (!fs.existsSync(absoluteAssetPath)) {

					const lastDotIndex = normalizedAssetPath.lastIndexOf('.');
					if (lastDotIndex === -1) {
						// ドットがない場合は画像ファイルと見なさない
						return match;
					}

					const baseName = normalizedAssetPath.substring(0, lastDotIndex);
					const ext = normalizedAssetPath.substring(lastDotIndex);

					// @2x のファイル名を作成
					const retinaFileName = `${baseName}@2x${ext}`;

					// @2x ファイルの絶対パス（publicDir 内）
					const absoluteRetinaAssetPath = path.resolve(publicDir, retinaFileName);

					// -------------------------------------------------------------
					// @2x ファイルが publicDir 内に存在するかチェック
					// -------------------------------------------------------------
					if (fs.existsSync(absoluteRetinaAssetPath)) {

						// 存在すれば、SCSS内のパスを @2x のものに置き換える
						let newAssetPath = retinaFileName;

						if (assetPath.startsWith('/')) {
							newAssetPath = `/${retinaFileName}`;
						} else if (assetPath.startsWith('../')) {
							newAssetPath = `../${retinaFileName}`;
						}

						const newMatch = match.replace(assetPath, newAssetPath);
						return newMatch;
					}
				}

				return match;
			});

			// 戻り値は { code: string } または null
			return {
				code: newCode,
			};
		},
	};
};

export default viteScssAssetReplacer;