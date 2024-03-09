import { getCollection } from "astro:content";

export async function getBlogs() {
	const blogs = await getCollection("blog");
	for (let i = 0; i < blogs.length; i++) {
		const blog = blogs[i];
		if (blog.slug === "markdown-style-guide") {
			blogs.splice(i, 1);
		}
	}
	return blogs;
}
