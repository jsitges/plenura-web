/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Wellness theme colors
				primary: {
					50: '#f0fdfa',
					100: '#ccfbf1',
					200: '#99f6e4',
					300: '#5eead4',
					400: '#2dd4bf',
					500: '#14b8a6',
					600: '#0d9488',
					700: '#0f766e',
					800: '#115e59',
					900: '#134e4a',
					950: '#042f2e'
				},
				secondary: {
					50: '#fdf4ff',
					100: '#fae8ff',
					200: '#f5d0fe',
					300: '#f0abfc',
					400: '#e879f9',
					500: '#d946ef',
					600: '#c026d3',
					700: '#a21caf',
					800: '#86198f',
					900: '#701a75',
					950: '#4a044e'
				}
			}
		}
	},
	plugins: [
		require('@tailwindcss/typography'),
		require('daisyui')
	],
	daisyui: {
		themes: [
			{
				plenura: {
					'primary': '#0d9488',
					'primary-content': '#ffffff',
					'secondary': '#c026d3',
					'secondary-content': '#ffffff',
					'accent': '#2dd4bf',
					'accent-content': '#115e59',
					'neutral': '#1f2937',
					'neutral-content': '#f3f4f6',
					'base-100': '#ffffff',
					'base-200': '#f9fafb',
					'base-300': '#f3f4f6',
					'base-content': '#1f2937',
					'info': '#3b82f6',
					'success': '#22c55e',
					'warning': '#f59e0b',
					'error': '#ef4444'
				}
			},
			'light',
			'dark'
		],
		defaultTheme: 'plenura'
	}
};
