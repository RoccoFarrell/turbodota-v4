declare module "svelte-headless-table" {
    import("../node_modules/svelte-headless-table/lib/index");
    export * from "../node_modules/svelte-headless-table/lib/index";
  }
  
  declare module "svelte-headless-table/plugins" {
    import("../node_modules/svelte-headless-table/lib/plugins/index");
    export * from "../node_modules/svelte-headless-table/lib/plugins/index";
  }
  
  declare module "svelte-headless-table/types" {
    import("../node_modules/svelte-headless-table/lib/types/Action");
    import("../node_modules/svelte-headless-table/lib/types/Entries");
    import("../node_modules/svelte-headless-table/lib/types/KeyPath");
    import("../node_modules/svelte-headless-table/lib/types/Label");
    import("../node_modules/svelte-headless-table/lib/types/Matrix");
    import("../node_modules/svelte-headless-table/lib/types/TablePlugin");
    export * from "../node_modules/svelte-headless-table/lib/types/Action";
    export * from "../node_modules/svelte-headless-table/lib/types/Entries";
    export * from "../node_modules/svelte-headless-table/lib/types/KeyPath";
    export * from "../node_modules/svelte-headless-table/lib/types/Label";
    export * from "../node_modules/svelte-headless-table/lib/types/Matrix";
    export * from "../node_modules/svelte-headless-table/lib/types/TablePlugin";
  }