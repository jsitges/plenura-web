
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const SUPABASE_SERVICE_ROLE_KEY: string;
	export const COLECTIVA_API_URL: string;
	export const COLECTIVA_API_KEY: string;
	export const COLECTIVA_ORG_ID: string;
	export const SHELL: string;
	export const npm_command: string;
	export const SESSION_MANAGER: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const npm_config_userconfig: string;
	export const npm_config_cache: string;
	export const NVM_INC: string;
	export const HISTCONTROL: string;
	export const XDG_MENU_PREFIX: string;
	export const CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING: string;
	export const HISTSIZE: string;
	export const HOSTNAME: string;
	export const NODE: string;
	export const SSH_AUTH_SOCK: string;
	export const MEMORY_PRESSURE_WRITE: string;
	export const ELECTRON_RUN_AS_NODE: string;
	export const COLOR: string;
	export const npm_config_local_prefix: string;
	export const XMODIFIERS: string;
	export const DESKTOP_SESSION: string;
	export const NO_AT_BRIDGE: string;
	export const npm_config_globalconfig: string;
	export const GPG_TTY: string;
	export const EDITOR: string;
	export const PWD: string;
	export const LOGNAME: string;
	export const XDG_SESSION_DESKTOP: string;
	export const XDG_SESSION_TYPE: string;
	export const VSCODE_ESM_ENTRYPOINT: string;
	export const npm_config_init_module: string;
	export const SYSTEMD_EXEC_PID: string;
	export const VSCODE_CODE_CACHE_PATH: string;
	export const _: string;
	export const XAUTHORITY: string;
	export const NoDefaultCurrentDirectoryInExePath: string;
	export const GJS_DEBUG_TOPICS: string;
	export const CLAUDECODE: string;
	export const GDM_LANG: string;
	export const HOME: string;
	export const USERNAME: string;
	export const CLAUDE_AGENT_SDK_VERSION: string;
	export const LANG: string;
	export const XDG_CURRENT_DESKTOP: string;
	export const npm_package_version: string;
	export const MEMORY_PRESSURE_WATCH: string;
	export const VSCODE_IPC_HOOK: string;
	export const WAYLAND_DISPLAY: string;
	export const INVOCATION_ID: string;
	export const MANAGERPID: string;
	export const INIT_CWD: string;
	export const CHROME_DESKTOP: string;
	export const npm_lifecycle_script: string;
	export const GJS_DEBUG_OUTPUT: string;
	export const MOZ_GMP_PATH: string;
	export const NVM_DIR: string;
	export const GNOME_SETUP_DISPLAY: string;
	export const npm_config_npm_version: string;
	export const XDG_SESSION_CLASS: string;
	export const npm_package_name: string;
	export const npm_config_prefix: string;
	export const LESSOPEN: string;
	export const USER: string;
	export const DISPLAY: string;
	export const npm_lifecycle_event: string;
	export const VSCODE_PID: string;
	export const SHLVL: string;
	export const NVM_CD_FLAGS: string;
	export const GIT_EDITOR: string;
	export const QT_IM_MODULE: string;
	export const VSCODE_CWD: string;
	export const npm_config_user_agent: string;
	export const OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
	export const npm_execpath: string;
	export const VSCODE_CRASH_REPORTER_PROCESS_TYPE: string;
	export const XDG_RUNTIME_DIR: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const DEBUGINFOD_URLS: string;
	export const npm_package_json: string;
	export const DEBUGINFOD_IMA_CERT_PATH: string;
	export const JOURNAL_STREAM: string;
	export const XDG_DATA_DIRS: string;
	export const GDK_BACKEND: string;
	export const npm_config_noproxy: string;
	export const PATH: string;
	export const npm_config_node_gyp: string;
	export const GDMSESSION: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const npm_config_global_prefix: string;
	export const VSCODE_NLS_CONFIG: string;
	export const MAIL: string;
	export const NVM_BIN: string;
	export const GIO_LAUNCHED_DESKTOP_FILE_PID: string;
	export const npm_node_execpath: string;
	export const GIO_LAUNCHED_DESKTOP_FILE: string;
	export const VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
	export const OLDPWD: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	export const PUBLIC_SUPABASE_URL: string;
	export const PUBLIC_SUPABASE_ANON_KEY: string;
	export const PUBLIC_MAPBOX_ACCESS_TOKEN: string;
	export const PUBLIC_APP_URL: string;
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		SUPABASE_SERVICE_ROLE_KEY: string;
		COLECTIVA_API_URL: string;
		COLECTIVA_API_KEY: string;
		COLECTIVA_ORG_ID: string;
		SHELL: string;
		npm_command: string;
		SESSION_MANAGER: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		npm_config_userconfig: string;
		npm_config_cache: string;
		NVM_INC: string;
		HISTCONTROL: string;
		XDG_MENU_PREFIX: string;
		CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING: string;
		HISTSIZE: string;
		HOSTNAME: string;
		NODE: string;
		SSH_AUTH_SOCK: string;
		MEMORY_PRESSURE_WRITE: string;
		ELECTRON_RUN_AS_NODE: string;
		COLOR: string;
		npm_config_local_prefix: string;
		XMODIFIERS: string;
		DESKTOP_SESSION: string;
		NO_AT_BRIDGE: string;
		npm_config_globalconfig: string;
		GPG_TTY: string;
		EDITOR: string;
		PWD: string;
		LOGNAME: string;
		XDG_SESSION_DESKTOP: string;
		XDG_SESSION_TYPE: string;
		VSCODE_ESM_ENTRYPOINT: string;
		npm_config_init_module: string;
		SYSTEMD_EXEC_PID: string;
		VSCODE_CODE_CACHE_PATH: string;
		_: string;
		XAUTHORITY: string;
		NoDefaultCurrentDirectoryInExePath: string;
		GJS_DEBUG_TOPICS: string;
		CLAUDECODE: string;
		GDM_LANG: string;
		HOME: string;
		USERNAME: string;
		CLAUDE_AGENT_SDK_VERSION: string;
		LANG: string;
		XDG_CURRENT_DESKTOP: string;
		npm_package_version: string;
		MEMORY_PRESSURE_WATCH: string;
		VSCODE_IPC_HOOK: string;
		WAYLAND_DISPLAY: string;
		INVOCATION_ID: string;
		MANAGERPID: string;
		INIT_CWD: string;
		CHROME_DESKTOP: string;
		npm_lifecycle_script: string;
		GJS_DEBUG_OUTPUT: string;
		MOZ_GMP_PATH: string;
		NVM_DIR: string;
		GNOME_SETUP_DISPLAY: string;
		npm_config_npm_version: string;
		XDG_SESSION_CLASS: string;
		npm_package_name: string;
		npm_config_prefix: string;
		LESSOPEN: string;
		USER: string;
		DISPLAY: string;
		npm_lifecycle_event: string;
		VSCODE_PID: string;
		SHLVL: string;
		NVM_CD_FLAGS: string;
		GIT_EDITOR: string;
		QT_IM_MODULE: string;
		VSCODE_CWD: string;
		npm_config_user_agent: string;
		OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
		npm_execpath: string;
		VSCODE_CRASH_REPORTER_PROCESS_TYPE: string;
		XDG_RUNTIME_DIR: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		DEBUGINFOD_URLS: string;
		npm_package_json: string;
		DEBUGINFOD_IMA_CERT_PATH: string;
		JOURNAL_STREAM: string;
		XDG_DATA_DIRS: string;
		GDK_BACKEND: string;
		npm_config_noproxy: string;
		PATH: string;
		npm_config_node_gyp: string;
		GDMSESSION: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		npm_config_global_prefix: string;
		VSCODE_NLS_CONFIG: string;
		MAIL: string;
		NVM_BIN: string;
		GIO_LAUNCHED_DESKTOP_FILE_PID: string;
		npm_node_execpath: string;
		GIO_LAUNCHED_DESKTOP_FILE: string;
		VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
		OLDPWD: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_SUPABASE_URL: string;
		PUBLIC_SUPABASE_ANON_KEY: string;
		PUBLIC_MAPBOX_ACCESS_TOKEN: string;
		PUBLIC_APP_URL: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
