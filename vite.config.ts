import { defineConfig } from "vite";
import { resolve } from "node:path";

const page = (value: string): string => resolve(__dirname, value);

export default defineConfig({
  resolve: {
    alias: {
      "@platform": page("src/platform"),
      "@shared": page("src/shared"),
      "@games": page("src/games"),
      "@content": page("content")
    }
  },
  build: {
    rollupOptions: {
      input: {
        launcher: page("index.html"),
        fruitStacker: page("games/fruit-stacker/index.html"),
        numberGarden: page("games/number-garden/index.html"),
        shapeBuilder: page("games/shape-builder/index.html"),
        patternParade: page("games/pattern-parade/index.html"),
        memoryTrails: page("games/memory-trails/index.html"),
        letterLanterns: page("games/letter-lanterns/index.html"),
        phonicsPop: page("games/phonics-pop/index.html"),
        wordMatch: page("games/word-match/index.html"),
        colorCraft: page("games/color-craft/index.html")
      }
    }
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node"
  }
});
