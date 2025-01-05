import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	site: "https://kennethnym.com",
	integrations: [mdx(), sitemap(), tailwind()],
	markdown: {
		shikiConfig: {
			// Choose from Shiki's built-in themes (or add your own)
			// https://shiki.style/themes
			theme: "catppuccin-mocha",
		},
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
	},
});
