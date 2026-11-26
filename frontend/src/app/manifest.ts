import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "家庭物品助手",
    short_name: "物品助手",
    description: "家里电器、家具的说明书与购买凭证问答助手",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F6F3",
    theme_color: "#0F6E66",
    lang: "zh-CN",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
