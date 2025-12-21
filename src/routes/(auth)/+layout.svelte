<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="text-center mb-8">
			<a href="/" class="inline-flex items-center gap-2">
				<div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
					<span class="text-white text-xl">🌿</span>
				</div>
				<span class="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
					Plenura
				</span>
			</a>
		</div>

		<!-- Card container -->
		<div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
			{@render children()}
		</div>

		<!-- Footer links -->
		<div class="text-center mt-6 text-sm text-gray-500">
			<a href="/" class="hover:text-primary-600 transition-colors">
				← Volver al inicio
			</a>
		</div>
	</div>
</div>
