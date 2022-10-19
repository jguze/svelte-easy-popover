<script lang="ts" context="module">
  export type PopoverTriggerEvent = "hover" | "click" | "focus";

  export interface PopoverChangeDetail {
    isOpen: boolean;
  }
</script>

<script lang="ts">
  import type {
    Placement,
    Middleware,
    ComputePositionReturn,
  } from "@floating-ui/dom";
  import { createEventDispatcher, onDestroy } from "svelte";
  import { computePosition, shift, offset } from "@floating-ui/dom";

  /** id for popover element */
  export let id: string | undefined = undefined;

  /** role for popover element
   *  @default 'region'
   */
  export let role: string | undefined = "region";

  /**
   * This gives you the ability to manually control when to open and close the popover.
   * If the built-in `triggerEvents` types do not suit your needs, this gives flexibility in
   * implementing your popover exactly how you desire.
   *
   * NOTE: If set, this completely overrides the values set by the `triggerEvents`.
   */
  export let isOpen: boolean = undefined;

  /**
   * The reference element to which we are placing the popover around.
   *
   * All modifiers, including `spaceAway` and `placement`, use this as the reference.
   *
   * If the `triggerEvent` is set, all events are set on the reference element itself.
   */
  export let referenceElement: Element;

  /**
   * Allows for ease-of-use when determining when to open and close the popover.
   * You simply pass the events as an array as a property, or simply pass a single event.
   * This means you can combine events if desired.
   *
   * Currently, there are only three options to choose from and combine:
   *
   * 1. `click`: When clicked, the popover will appear. When clicked again, the popover will disappear.
   * 2. `hover`: When hovered, the popover appears. When hovered away, this will disappear.
   * 3. `focus`: When focused, the popover appears. When blurred, it will disappear.
   * Watch out with some caveats:
   *     - When using `hover`, it's recommended to combine it with,
   *       `focus` This way, keyboard navigation and touch devices can continue to function as necessary.
   *     - By default, hovering onto the popover element will continue to keep the popover open. This opens it up to
   *       be a menu item too. If not desired, please see the property `remainOpenOnPopoverHover`.
   *     - With `focus`, if the `document.activeElement` is within the popover, by default it will remain open.
   *       Otherwise, override this with the `remainOpenOnPopoverFocus` property.
   */
  export let triggerEvents: PopoverTriggerEvent[] = [];

  /**
   * When the `triggerEvents` is `hover`, we ensure that hovering over the popover element itself does
   * not cause it to hide. If this is undesireable, it can be overridden here.
   */
  export let remainOpenOnPopoverHover: boolean = true;

  /**
   * When the `triggerEvents` is `focus`, we ensure that focusing on the popover element itself does
   * not cause it to hide. This is valuable for keyboard navigation into the popover.
   * If this is undesireable, it can be overridden here.
   */
  export let remainOpenOnPopoverFocus: boolean = true;

  /**
   * If using any `triggerEvents`, force close the popover when hitting espape.
   */
  export let closeOnEscape: boolean = false;

  /**
   * If the `triggerEvents` contains `click`, then force close the popover when you click outside the reference and popover.
   */
  export let closeOnClickAway: boolean = false;

  /**
   * If you have multiple trigger events including `click`, such as hover and click, you may not want clicks while the popover
   * is animating in to cause it to close, as that is bad UX. This is a buffer window to wait while your
   * popover animates in.
   */
  export let ignoreClickWhileOpeningBuffer: number = 300;

  /**
   * This is a special case when hover is enabled. Opening the context menu (right-click) also triggers
   * the mouseleave handler in many browsers. This is most apparent in Firefox.
   * A workaround is to just keep it open when we see the context menu open. However,
   * there's no reliable way to know when it gets removed, and therefore you should be wary of using this.
   */
  export let handleContextMenuForHover: boolean = false;

  /** Amount of time to wait before the an action closes the menu */
  export let closeDelay: number = 50;

  /**
   * This spaces the popover element away from the reference element in pixels.
   * This uses the floating-ui offset Middleware which
   * is documented [here](https://floating-ui.com/docs/offset)
   * this prop has no effect if the middleware prop is overriden
   */
  export let spaceAway: number = 6;

  /**
   * The placement of the popover with respect to the reference element.
   * This uses the floating-ui `placement` option, which is documented
   * [here](https://floating-ui.com/docs/computePosition#placement)
   */
  export let placement: Placement = "bottom";

  /** Middleware are plain objects floating-ui uses that modifies the positioning coordinates in some fashion, or provide useful data for the consumer to use
   * documented [here](https://floating-ui.com/docs/middleware)
   * @default [shift(), offset(spaceAway)]
  */
  export let middleware: Array<Middleware> = [shift(), offset(spaceAway)];

  export let popoverElement: HTMLElement = undefined;

  let isPopoverVisible: boolean = false;
  let isPopoverHovered: boolean = false;
  let isReferenceClicked: boolean = false;
  let isReferenceFocused: boolean = false;
  let isReferenceHovered: boolean = false;
  let isPopoverFocused: boolean = false;
  let isContextMenuOpen: boolean = false;

  let listeners: {
    element: Element;
    event: string;
    fn: EventListenerOrEventListenerObject;
  }[] = [];

  let triggerEventSet = new Set<string>();

  const dispatch = createEventDispatcher<{ change: PopoverChangeDetail }>();

  let visibleTimer: ReturnType<typeof setTimeout>;
  let visibleTimerCompleted: boolean = false;

  $: {
    const oldState = isPopoverVisible;
    isPopoverVisible =
      typeof isOpen === "boolean"
        ? isOpen
        : isPopoverHovered ||
          isReferenceClicked ||
          isReferenceFocused ||
          isReferenceHovered ||
          isPopoverFocused ||
          isContextMenuOpen;

    if (oldState !== isPopoverVisible) {
      // If you're using click events with hovers, this buffer helps ensure their UX
      // makes sense. If you click it while it's opening, it won't close it immediately.
      if (isPopoverVisible) {
        visibleTimer = setTimeout(
          () => (visibleTimerCompleted = true),
          ignoreClickWhileOpeningBuffer
        );
      } else {
        clearTimeout(visibleTimer);
        visibleTimerCompleted = false;
      }

      dispatch("change", {
        isOpen: isPopoverVisible,
      });
    }
  }

  $: {
    triggerEventSet = new Set(triggerEvents);
    // Reset listeners for new trigger events.
    removeListeners();
  }

  $: if (isPopoverVisible && popoverElement && referenceElement) {
      // Destroy the old instance if it exists
      createInstance(placement, middleware, referenceElement);
    }

  $: {
    if (triggerEventSet.size > 0 && referenceElement) {
      if (triggerEventSet.has("click")) {
        addListener(referenceElement, "click", onReferenceClick);
      }

      if (triggerEventSet.has("hover")) {
        addListener(referenceElement, "mouseenter", onReferenceHover);
        addListener(referenceElement, "mouseleave", onReferenceUnhover);
      }

      if (triggerEventSet.has("focus")) {
        addListener(referenceElement, "focus", onReferenceFocus);
        addListener(referenceElement, "blur", onReferenceBlur);
      }
    }
  }

  $: {
    if (triggerEventSet.size > 0 && popoverElement) {
      if (triggerEventSet.has("hover") && remainOpenOnPopoverHover) {
        addListener(popoverElement, "mouseenter", onPopoverHover);
        addListener(popoverElement, "mouseleave", onPopoverUnhover);

        if (handleContextMenuForHover) {
          addListener(popoverElement, "contextmenu", onPopoverContextMenu);
        }
      }

      if (triggerEventSet.has("focus") && remainOpenOnPopoverFocus) {
        addListener(popoverElement, "focusin", onPopoverFocus);
        addListener(popoverElement, "focusout", onPopoverBlur);
      }
    }
  }

  function addListener(element: Element, event: string, fn: EventListenerOrEventListenerObject) {
    element.addEventListener(event, fn);
    listeners.push({ element, event, fn });
  }

  function createInstance(placement: Placement, middleware: Middleware[], referenceElement: Element) {
    computePosition(referenceElement, popoverElement, {
      placement,
      middleware,
    }).then((params: ComputePositionReturn) => computePositionReturn(params));
  }

  export function computePositionReturn(params: ComputePositionReturn) {
    Object.assign(popoverElement.style, {
      left: `${params.x}px`,
      top: `${params.y}px`,
    });
  }

  function escapeListener(e: KeyboardEvent) {
    if (e.key === "Escape") {
      forceClose();
    }
  }

  function closeIfNotFocused() {
    if (
      !referenceElement?.contains(document.activeElement) &&
      !popoverElement?.contains(document.activeElement)
    ) {
      forceClose();
    }
  }

  function closeOnClickAwayListener(_: MouseEvent) {
    // Firefox doesn't focus on buttons on some browsers
    if (
      !referenceElement?.contains(_.target as Element) &&
      !popoverElement?.contains(_.target as Element)
    ) {
      closeIfNotFocused();
    }
  }

  $: {
    if (window?.document) {
      if (isPopoverVisible && closeOnEscape) {
        document.addEventListener("keydown", escapeListener);
      } else {
        document.removeEventListener("keydown", escapeListener);
      }
    }
  }

  $: {
    if (window?.document) {
      if (isPopoverVisible && closeOnClickAway) {
        document.addEventListener("click", closeOnClickAwayListener);
      } else {
        document.removeEventListener("click", closeOnClickAwayListener);
      }
    }
  }

  function forceClose() {
    isReferenceClicked = false;
    isReferenceHovered = false;
    isReferenceFocused = false;
    isPopoverHovered = false;
    isPopoverHovered = false;
    isContextMenuOpen = false;
    isPopoverFocused = false;
  }

  /**
   * It's weird if you hover AND have click events. In this case,
   * we should always close it if you are clicked in and we trigger a disable
   */
  function forceCloseIfClickedIn() {
    if (isPopoverVisible && isReferenceClicked) {
      forceClose();
    }
  }

  function onReferenceClick() {
    isReferenceClicked = !isReferenceClicked;

    // Treat it as if the click occured since it has been visible long enough
    if (!isReferenceClicked || visibleTimerCompleted) {
      forceClose();
    }
  }

  let referenceUnhoverTimer: ReturnType<typeof setTimeout>;

  function onReferenceHover() {
    isReferenceHovered = true;

    clearTimeout(referenceUnhoverTimer);

    if (isContextMenuOpen) {
      isContextMenuOpen = false;
    }
  }

  function onReferenceUnhover() {
    // Ensure we're not wildly flipping between hover and unhover
    referenceUnhoverTimer = setTimeout(() => {
      isReferenceHovered = false;

      if (!isPopoverHovered) {
        isPopoverFocused = false;
      }
    }, closeDelay);
  }

  let referenceBlurTimer: ReturnType<typeof setTimeout>;

  function onReferenceFocus() {
    isReferenceFocused = true;
    clearTimeout(referenceBlurTimer);
  }

  function onReferenceBlur() {
    referenceBlurTimer = setTimeout(() => {
      isReferenceFocused = false;
      forceCloseIfClickedIn();
    }, closeDelay);
  }

  let popoverUnhoverTimer: ReturnType<typeof setTimeout>;

  function onPopoverHover() {
    isPopoverHovered = true;

    clearTimeout(popoverUnhoverTimer);

    if (isContextMenuOpen) {
      isContextMenuOpen = false;
    }
  }

  function onPopoverUnhover() {
    // Ensure we're not wildly flipping between hover and unhover
    popoverUnhoverTimer = setTimeout(() => {
      isPopoverHovered = false;

      if (!isReferenceHovered) {
        isPopoverFocused = false;
      }
      forceCloseIfClickedIn();
    }, closeDelay);
  }

  let popoverBlurTimer: ReturnType<typeof setTimeout>;
  function onPopoverFocus() {
    isPopoverFocused = true;

    clearTimeout(popoverBlurTimer);
  }

  function onPopoverBlur() {
    popoverBlurTimer = setTimeout(() => {
      isPopoverFocused = false;
      forceCloseIfClickedIn();
    }, closeDelay);
  }

  function onPopoverContextMenu() {
    isContextMenuOpen = true;
  }

  function removeListeners() {
    for (const { element, event, fn } of listeners) {
      element?.removeEventListener(event, fn);
    }
    listeners = [];
  }

  onDestroy(() => {
    removeListeners();
  });
</script>

{#if isPopoverVisible}
  <div {id} {role} class="svelte-easy-popover" bind:this={popoverElement}>
    <slot />
  </div>
{/if}

<style>
  .svelte-easy-popover {
    position: absolute;
    z-index: var(--z-index, 1);
  }
</style>
