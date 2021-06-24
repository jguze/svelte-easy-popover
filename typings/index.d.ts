declare module "*.svelte" {
    const value: any;
    export default value;
}

declare module '@popperjs/core/dist/esm/popper' {
    const createPopper: typeof import("@popperjs/core").createPopper;
    export { createPopper };
}
