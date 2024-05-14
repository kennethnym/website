import typography from "@tailwindcss/typography";
import catppuccin from "@catppuccin/tailwindcss";

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	safelist: ["bg-peach", "text-red"],
	theme: {
		extend: {},
	},
	plugins: [typography, catppuccin],
};
