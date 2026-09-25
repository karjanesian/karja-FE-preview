import { normalizeProductType, type ProductType } from '$lib/types';
import FileText from 'lucide-svelte/icons/file-text';
import Calendar from 'lucide-svelte/icons/calendar';
import Briefcase from 'lucide-svelte/icons/briefcase';

export interface ProductTypeTheme {
	type: ProductType;
	icon: typeof FileText;
	labelKey: 'common_type_digital' | 'common_type_session' | 'common_type_service';
	textColor: string;
	iconColor: string;
	bgColor: string;
	borderColor: string;
	iconBgColor: string;
	hoverBorderColor: string;
	hoverBgColor: string;
	badgeClass: string;
	filterActiveClass: string;
	indicatorColor: string;
}

export const PRODUCT_THEMES: Record<ProductType, ProductTypeTheme> = {
	digital: {
		type: 'digital',
		icon: FileText,
		labelKey: 'common_type_digital',
		textColor: 'text-[#1D4ED8]',
		iconColor: 'text-[#2563EB]',
		bgColor: 'bg-[#EFF6FF]',
		borderColor: 'border-[#BFDBFE]',
		iconBgColor: 'bg-[#EFF6FF] text-[#2563EB]',
		hoverBorderColor: 'hover:border-[#93C5FD]',
		hoverBgColor: 'hover:bg-[#F8FAFC]',
		badgeClass: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
		filterActiveClass: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#93C5FD] font-bold shadow-2xs',
		indicatorColor: '#2563EB'
	},
	session: {
		type: 'session',
		icon: Calendar,
		labelKey: 'common_type_session',
		textColor: 'text-[#6D28D9]',
		iconColor: 'text-[#7C3AED]',
		bgColor: 'bg-[#F5F3FF]',
		borderColor: 'border-[#DDD6FE]',
		iconBgColor: 'bg-[#F5F3FF] text-[#7C3AED]',
		hoverBorderColor: 'hover:border-[#C4B5FD]',
		hoverBgColor: 'hover:bg-[#FAF8FF]',
		badgeClass: 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]',
		filterActiveClass: 'bg-[#F5F3FF] text-[#6D28D9] border-[#C4B5FD] font-bold shadow-2xs',
		indicatorColor: '#7C3AED'
	},
	service: {
		type: 'service',
		icon: Briefcase,
		labelKey: 'common_type_service',
		textColor: 'text-[#C2410C]',
		iconColor: 'text-[#EA580C]',
		bgColor: 'bg-[#FFF7ED]',
		borderColor: 'border-[#FED7AA]',
		iconBgColor: 'bg-[#FFF7ED] text-[#EA580C]',
		hoverBorderColor: 'hover:border-[#FDBA74]',
		hoverBgColor: 'hover:bg-[#FFFDFB]',
		badgeClass: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
		filterActiveClass: 'bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74] font-bold shadow-2xs',
		indicatorColor: '#EA580C'
	}
};

export function getProductTypeTheme(type: unknown): ProductTypeTheme {
	const canonical = normalizeProductType(type as never);
	return PRODUCT_THEMES[canonical] || PRODUCT_THEMES.digital;
}
