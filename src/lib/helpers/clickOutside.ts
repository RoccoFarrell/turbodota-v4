export function clickOutside(node: HTMLElement, callback?: (() => void) | string) {
    const ignore = typeof callback === 'string' ? callback : undefined;
    const cb = typeof callback === 'function' ? callback : undefined;
    const handleClick = (event: Event) => {
        const target = event.target as HTMLElement;
        if (!event.target || (ignore && target.closest(ignore))) {
            return;
        }
        if (node && !node.contains(target) && !event.defaultPrevented) {
            if (cb) {
                cb();
            } else {
                node.dispatchEvent(new CustomEvent('click_outside'));
            }
        }
    };

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    };
}