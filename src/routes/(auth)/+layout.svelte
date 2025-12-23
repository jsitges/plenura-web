<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="text-center mb-8">
			<a href="/" class="inline-flex items-center gap-3">
				<img src="/logo.svg" alt="Plenura" class="w-12 h-12 rounded-xl" />
				<span class="text-2xl font-bold text-[#4a7c59]">
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
