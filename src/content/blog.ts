import { getCollection } from "astro:content";

export async function getBlogs() {
	const blogs = await getCollection("blog");
	return blogs.filter(
		(it) => it.slug !== "markdown-style-guide" && !it.data.hidden,
	);
}
