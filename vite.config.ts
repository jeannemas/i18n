import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],

  test: {
    coverage: {
      include: ['src/lib/**/*.{js,ts}'],
      provider: 'istanbul',
    },
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
});
