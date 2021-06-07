<script lang="ts" context="module">
  export type PopoverPlacementOptions =
    | "auto"
    | "auto-start"
    | "auto-end"
    | "top"
    | "top-start"
    | "top-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end"
    | "right"
    | "right-start"
    | "right-end"
    | "left"
    | "left-start"
    | "left-end";

  export type PopoverTriggerEvent = "hover" | "click" | "focus";

  export interface PopoverChangeDetail {
    isOpen: boolean;
  }

</script>

<script lang="ts">
  import { createPopper } from "@popperjs/core";
  import { createEventDispatcher, onDestroy } from "svelte";

  /**
   * This gives you the ability to manually control when to open and close the popover.
   * If the built-in `triggerEvents` types do not suit your needs, this gives flexibility in
   * implementing your popover exactly how you desire.
   *
   * NOTE: If set, this completely overrides the values set by the `triggerEvents`.
   */
  export let isOpen: boolean;

  /**
   * The reference element to which we are placing the popover around. if no reference
   * element is given, this will use the parent of this current component.
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
   * The placement of the popover with respect to the reference element.
   * This uses the Popper `placement` option, which is documented
   * [here](https://popper.js.org/docs/v2/constructors//#placement)
   */
  export let placement: PopoverPlacementOptions = "bottom";

  /**
   * This spaces the popover element away from the reference element in pixels.
   * This uses the Popper `distance` property in the `offset` modifier, which
   * is documented [here](https://popper.js.org/docs/v2/modifiers/offset/#offset-1)
   */
  export let spaceAway: number = 0;

  /**
   * This spaces the popover element along the reference element in pixels.
   * This uses the Popper `skid` property in the `offset` modifier, which
   * is documented [here](https://popper.js.org/docs/v2/modifiers/offset/#offset-1)
   */
  export let spaceAlong: number = 0;

  /**
   * For more customizability, you may pass any options to the Popper instance to
   * customize the Popover. To see all Popper options, see the documentation [here](https://popper.js.org/docs/v2/constructors/#options)
   */
  export let popperOptions: Parameters<typeof createPopper>[2] = {};

  let popoverElement: HTMLElement;
  let popperInstance: ReturnType<typeof createPopper>;

  let isPopoverVisible: boolean = false;
  let isPopoverHovered: boolean = false;
  let isReferenceClicked: boolean = false;
  let isReferenceFocused: boolean = false;
  let isReferenceHovered: boolean = false;
  let isPopoverFocused: boolean = false;

  let listeners: {
    element: Element;
    event: string;
    fn: EventListenerOrEventListenerObject;
  }[] = [];

  let triggerEventSet = new Set<string>();

  const dispatch = createEventDispatcher<{ change: PopoverChangeDetail }>();

  $: {
    const oldState = isPopoverVisible;
    isPopoverVisible =
      typeof isOpen === "boolean"
        ? isOpen
        : isPopoverHovered ||
          isReferenceClicked ||
          isReferenceFocused ||
          isReferenceHovered ||
          isPopoverFocused;

    if (oldState !== isPopoverVisible) {
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

  $: {
    if (isPopoverVisible && popoverElement && referenceElement) {
      // Destroy the old instance if it exists
      destroyInstance();
      createInstance();
    }
  }

  $: {
    if (popperInstance) {
      popperInstance.setOptions(getOptions());
    }
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
      }

      if (triggerEventSet.has("focus") && remainOpenOnPopoverFocus) {
        addListener(popoverElement, "focusin", onPopoverFocus);
        addListener(popoverElement, "focusout", onPopoverBlur);
      }
    }
  }

  function addListener(
    element: Element,
    event: string,
    fn: EventListenerOrEventListenerObject
  ) {
    element.addEventListener(event, fn);
    listeners.push({ element, event, fn });
  }

  function destroyInstance() {
    popperInstance?.destroy();
    popperInstance = null;
  }

  function createInstance() {
    popperInstance = createPopper(
      referenceElement,
      popoverElement,
      getOptions()
    );
  }

  $: getOptions = function () {
    return {
      ...popperOptions,
      placement,
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [spaceAlong, spaceAway],
          },
        },
      ],
    };
  };

  function onReferenceClick() {
    isReferenceClicked = !isReferenceClicked;
  }

  function onReferenceHover() {
    isReferenceHovered = true;
  }

  function onReferenceUnhover() {
    isReferenceHovered = false;
  }

  function onReferenceFocus() {
    isReferenceFocused = true;
  }

  function onReferenceBlur() {
    isReferenceFocused = false;
  }

  function onPopoverHover() {
    isPopoverHovered = true;
  }

  function onPopoverUnhover() {
    isPopoverHovered = false;
  }

  function onPopoverFocus() {
    isPopoverFocused = true;
  }

  function onPopoverBlur() {
    isPopoverFocused = false;
  }

  function removeListeners() {
    for (const { element, event, fn } of listeners) {
      element?.removeEventListener(event, fn);
    }
    listeners = [];
  }

  onDestroy(() => {
    destroyInstance();
    removeListeners();
  });

</script>

{#if isPopoverVisible}
  <div class="popover" bind:this={popoverElement}>
    {#if triggerEventSet.has("hover") && spaceAway > 0}
      <div
        class="popover-hover-bridge"
        style={`--popover-space-away: ${spaceAway}px;`}
      />
    {/if}
    <slot />
  </div>
{/if}

<style>
  .popover-hover-bridge {
    position: absolute;
  }

  .popover:global([data-popper-placement^="top"]) .popover-hover-bridge {
    bottom: calc(0px - var(--popover-space-away));
    width: 100%;
    height: var(--popover-space-away);
  }

  .popover:global([data-popper-placement^="bottom"]) .popover-hover-bridge {
    top: calc(0px - var(--popover-space-away));
    width: 100%;
    height: var(--popover-space-away);
  }

  .popover:global([data-popper-placement^="left"]) .popover-hover-bridge {
    right: calc(0px - var(--popover-space-away));
    height: 100%;
    width: var(--popover-space-away);
  }

  .popover:global([data-popper-placement^="right"]) .popover-hover-bridge {
    left: calc(0px - var(--popover-space-away));
    height: 100%;
    width: var(--popover-space-away);
  }

</style>
