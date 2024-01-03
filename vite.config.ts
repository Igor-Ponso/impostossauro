// Plugins
import vue from "@vitejs/plugin-vue";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import ViteFonts from "unplugin-fonts/vite";
import Pages from "vite-plugin-pages";
import path from "node:path";
import Inspect from "vite-plugin-inspect";
import Layouts from "vite-plugin-vue-layouts";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

// Utilities
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    VueI18nPlugin({
      include: path.resolve(__dirname, "@/locales/**"),
    }),
    vuetify({
      autoImport: true,
    }),
    ViteFonts({
      google: {
        families: [
          {
            name: "Roboto",
            styles: "wght@100;300;400;500;700;900",
          },
        ],
      },
    }),
    AutoImport({
      dts: "@types/auto-imports.d.ts",
      imports: ["vue", "@vueuse/core", "@vueuse/head", "vue-router"],
    }),
    Layouts({
      layoutsDirs: "src/layouts",
      defaultLayout: "default",
    }),
    Pages({
      extensions: ["vue"],
    }),
    Components({
      extensions: ["vue"],
      include: [/\.vue$/, /\.vue\?vue/],
      dirs: [
        "src/components/LayoutCompositions",
        "src/components",
        "src/widgets",
      ],
      dts: "@types/components.d.ts",
      directoryAsNamespace: true,
    }),
    Inspect(),
  ],
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".js", ".json", ".ts", ".vue"],
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
  server: {
    port: 3000,
  },
});
