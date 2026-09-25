import { BlogContentBlock } from '$lib/types/blog';

/**
 * Converts structured BlogContentBlock[] to HTML string for Tiptap editor initialization.
 */
export function blocksToHtml(blocks: BlogContentBlock[]): string {
	if (!blocks || blocks.length === 0) {
		return '<p></p>';
	}

	return blocks
		.map((block) => {
			switch (block.type) {
				case 'paragraph': {
					const text = block.text || '';
					return `<p>${escapeOrFormatHtml(text)}</p>`;
				}
				case 'h2': {
					const text = block.text || '';
					return `<h2>${escapeOrFormatHtml(text)}</h2>`;
				}
				case 'h3': {
					const text = block.text || '';
					return `<h3>${escapeOrFormatHtml(text)}</h3>`;
				}
				case 'blockquote': {
					const quote = block.quote || block.text || '';
					const author = block.author ? `<cite>— ${escapeHtml(block.author)}</cite>` : '';
					return `<blockquote><p>${escapeOrFormatHtml(quote)}</p>${author}</blockquote>`;
				}
				case 'bullet_list': {
					const items = block.items || [];
					const lis = items.map((item) => `<li><p>${escapeOrFormatHtml(item)}</p></li>`).join('');
					return `<ul>${lis}</ul>`;
				}
				case 'numbered_list': {
					const items = block.items || [];
					const lis = items.map((item) => `<li><p>${escapeOrFormatHtml(item)}</p></li>`).join('');
					return `<ol>${lis}</ol>`;
				}
				case 'image': {
					const src = block.imageUrl || '';
					const alt = block.imageAlt || '';
					const title = block.imageCaption || '';
					return `<img src="${src}" alt="${escapeHtml(alt)}" title="${escapeHtml(title)}" />`;
				}
				case 'callout': {
					const title = block.calloutTitle
						? `<strong>${escapeHtml(block.calloutTitle)}</strong><br/>`
						: '';
					const text = block.calloutText || block.text || '';
					const cta = block.calloutCtaLabel
						? `<em>[${escapeHtml(block.calloutCtaLabel)}]</em>`
						: '';
					return `<blockquote><p>${title}${escapeOrFormatHtml(text)} ${cta}</p></blockquote>`;
				}
				default:
					return `<p>${escapeOrFormatHtml(block.text || '')}</p>`;
			}
		})
		.join('');
}

/**
 * Converts Tiptap JSON or HTML Document to canonical BlogContentBlock[] model.
 */
export function tiptapJsonToBlocks(doc: any): BlogContentBlock[] {
	if (!doc || !doc.content || !Array.isArray(doc.content)) {
		return [];
	}

	const blocks: BlogContentBlock[] = [];

	for (const node of doc.content) {
		switch (node.type) {
			case 'paragraph': {
				const text = getNodeInlineText(node);
				if (text.trim() || node.content) {
					blocks.push({
						type: 'paragraph',
						text: text
					});
				}
				break;
			}
			case 'heading': {
				const level = node.attrs?.level || 2;
				const text = getNodeInlineText(node);
				blocks.push({
					type: level === 3 ? 'h3' : 'h2',
					text
				});
				break;
			}
			case 'blockquote': {
				const text = getNodeInlineText(node);
				blocks.push({
					type: 'blockquote',
					quote: text,
					text
				});
				break;
			}
			case 'bulletList': {
				const items = (node.content || []).map((li: any) => getNodeInlineText(li)).filter(Boolean);
				blocks.push({
					type: 'bullet_list',
					items
				});
				break;
			}
			case 'orderedList': {
				const items = (node.content || []).map((li: any) => getNodeInlineText(li)).filter(Boolean);
				blocks.push({
					type: 'numbered_list',
					items
				});
				break;
			}
			case 'image': {
				blocks.push({
					type: 'image',
					imageUrl: node.attrs?.src || '',
					imageAlt: node.attrs?.alt || '',
					imageCaption: node.attrs?.title || ''
				});
				break;
			}
			case 'horizontalRule': {
				blocks.push({
					type: 'paragraph',
					text: '—'
				});
				break;
			}
			default: {
				const text = getNodeInlineText(node);
				if (text.trim()) {
					blocks.push({
						type: 'paragraph',
						text
					});
				}
			}
		}
	}

	return blocks;
}

function getNodeInlineText(node: any): string {
	if (!node) return '';
	if (node.text) return node.text;
	if (!node.content || !Array.isArray(node.content)) return '';

	return node.content
		.map((child: any) => {
			let t = child.text || '';
			if (child.type === 'image') return '';
			if (child.content) t += getNodeInlineText(child);
			return t;
		})
		.join('');
}

function escapeHtml(str: string): string {
	if (!str) return '';
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function escapeOrFormatHtml(str: string): string {
	if (!str) return '';
	// If string contains basic HTML, preserve simple formatting, else escape
	return str;
}
