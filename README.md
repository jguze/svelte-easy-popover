# Introduction

An easy-to-use popover component for Svelte 3 with out-of-the-box functionality.

View the [Docs](https://jguze.github.io/svelte-easy-popover/) and [detailed usage](https://jguze.github.io/svelte-easy-popover/?path=/docs/examples-popover--tooltip-style-appearing-above-the-reference-element).

This component is very flexible, while providing a lot of out-of-the-box functionality:

1. Built in click, hover, and focus events to trigger showing the popover
2. Simple, slot-driven design of the popover. No need to call special Javascript functions. Allows you
   to add your own transitions and styling to the popover within the normal style-block and transition directive.
3. Flexible. The `isOpen` parameter lets you build the interaction exactly how you'd wish
4. Extensible. This component uses [Popper](https://popper.js.org/) underneath, and exposes the popperOptions to you.

# Install

```
npm install svelte-easy-popover
```

## Usage

This is an example of an easy popover with a transition, placed above the button, spaced 10px away.

```svelte
<script>
    import Popover from 'svelte-easy-popover';

    let referenceElement;
</script>

<button bind:this={referenceElement}>Open popover</button>
<Popover
  triggerEvents={["hover, focus"]}
  {referenceElement}
  placement="top"
  spaceAway={10}
>
    <div
        class="popover-contents"
        transition:fade={{ duration: 250 }}
    >
        I'm a popover!
    </div>
</Popover>

<style>
    .popover-contents {
        border: 1px solid black;
        border-radius: 4px;
        padding: 8px;
    }
</style>
```

View the [argument documentation](?path=/docs/examples-popover--tooltip-style-appearing-above-the-reference-element) to view more detailed information on how to use the component, or view the [examples](?path=/story/examples-popover--tooltip-style-appearing-above-the-reference-element) for different ways to use it.

## Popper

Underneath, this component is using [Popper](https://popper.js.org/). Please read their documentation for more details, but in general you shouldn't require knowing anything about Popper to get started.

## Listening for state changes

If you use the `triggerEvents` property, it's not always obvious when the popover is open or closed. If you need to modify other state when
opened or closed, you can freely use the `on:change` event, which is dispatched. It provides a simple way to keep track of the actual popover
state if so desired.

```svelte
    import Popover from 'svelte-easy-popover';

    let referenceElement;
    let isPopoverOpen;
</script>

<button bind:this={referenceElement}>Popover is {isPopoverOpen ? "Opened" : "Closed"}</button>
<Popover
  triggerEvents={["hover", "focus"]}
  {referenceElement}
  placement="top"
  spaceAway={10}
  on:change={({ detail: { isOpen }}) => isPopoverOpen = isOpen}
>
    <div transition:fade={{ duration: 250 }}>
        I'm a popover!
    </div>
</Popover>
```

# Development

This project is easy to get running locally.
For development, it is using the Svelte Storybook integration. Read more [here](https://storybook.js.org/docs/svelte/get-started/introduction).

1. Install dependencies

```
npm install
```

2. Launch Storybook. By default it lauches at http://localhost:6006

```
npm run storybook
```
