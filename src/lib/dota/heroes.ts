// Slug scheme for public/heroes/*.png files; matches OpenDota localized_name.
export function heroSlug(hero: string): string {
	return hero
		.toLowerCase()
		.replaceAll("'", '')
		.replaceAll(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export function heroIconSrc(hero: string): string {
	return `/heroes/${heroSlug(hero)}.png`
}
