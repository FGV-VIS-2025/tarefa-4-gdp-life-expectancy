import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
            pages: 'build',
            assets: 'build',
            fallback: undefined
        }),

        // Adiciona a configuração do caminho base
        paths: {
            base: process.env.NODE_ENV === 'production' ? '/tarefa-4-gdp-life-expectancy' : ''
        }
	}
};

export default config;
