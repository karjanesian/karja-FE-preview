/**
 * Compresses an image file in the browser using HTML5 Canvas
 * to keep base64 data URLs lightweight (<150KB) and prevent LocalStorage quota overflow.
 * Preserves the original image's aspect ratio within maximum bounds (defaults to 16:9 1600x900).
 */
export async function compressImageFile(
	file: File,
	maxWidth = 1600,
	maxHeight = 900,
	quality = 0.82
): Promise<string> {
	return new Promise((resolve) => {
		// If it's SVG or not an image, fall back to basic reader
		if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
			const reader = new FileReader();
			reader.onload = () => resolve((reader.result as string) || '');
			reader.onerror = () => resolve('');
			reader.readAsDataURL(file);
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const dataUrl = e.target?.result as string;
			if (!dataUrl) {
				resolve('');
				return;
			}

			const img = new Image();
			img.onload = () => {
				let { width, height } = img;

				const scale = Math.min(1, maxWidth / width, maxHeight / height);
				width = Math.round(width * scale);
				height = Math.round(height * scale);

				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');

				if (!ctx) {
					resolve(dataUrl);
					return;
				}

				// Fill white background for transparent images when converting to JPEG
				ctx.fillStyle = '#FFFFFF';
				ctx.fillRect(0, 0, width, height);
				ctx.drawImage(img, 0, 0, width, height);

				try {
					const compressed = canvas.toDataURL('image/jpeg', quality);
					resolve(compressed);
				} catch (_) {
					resolve(dataUrl);
				}
			};

			img.onerror = () => {
				resolve(dataUrl);
			};

			img.src = dataUrl;
		};

		reader.onerror = () => resolve('');
		reader.readAsDataURL(file);
	});
}
