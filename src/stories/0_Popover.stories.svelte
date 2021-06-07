<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import Popover from "../Popover.svelte";
  import { fade } from "svelte/transition";

  let referenceElement;

</script>

<Meta
  title="Examples/Popover"
  component={Popover}
  argTypes={{
    placement: {
      control: {
        type: "select",
        options: [
          "auto",
          "auto-start",
          "auto-end",
          "top",
          "top-start",
          "top-end",
          "bottom",
          "bottom-start",
          "bottom-end",
          "right",
          "right-start",
          "right-end",
          "left",
          "left-start",
          "left-end",
        ],
      },
    },
    triggerEvents: {
      control: {
        type: "multi-select",
        options: ["click", "hover", "focus"],
      },
    },
    referenceElement: {
      control: {
        disable: true,
      },
    },
    isPopoverVisible: {
      control: {
        disable: true,
      },
    },
  }}
/>

<Template let:args id="TextPopover">
  <button class="popover-trigger" bind:this={referenceElement}>
    Open popover
  </button>
  <Popover {...args} {referenceElement}
    ><div class="popover-contents" transition:fade={{ duration: 200 }}>
      This is a popover
    </div></Popover
  >
</Template>

<Template let:args id="InteractivePopover">
  <button class="popover-trigger" bind:this={referenceElement}>
    Open popover
  </button>
  <Popover {...args} {referenceElement}
    ><div
      class="popover-contents space-between"
      transition:fade={{ duration: 200 }}
    >
      Popover doesn't disappear if focused within
      <button> Button 1 </button>

      <button> Button 2 </button>
    </div>
  </Popover>
</Template>

<Story
  name="Tooltip style appearing above the reference element"
  args={{ placement: "top", triggerEvents: ["hover"] }}
  template="TextPopover"
/>

<Story
  name="Hover and focus with interactive elements in the popover"
  args={{
    placement: "bottom",
    triggerEvents: ["hover", "focus"],
    spaceAway: 20,
  }}
  template="InteractivePopover"
/>

<Story
  name="Popover with defaults without triggerEvents set"
  template="TextPopover"
/>

<style>
  button {
    background-color: #007bff;
    color: white;
    padding: 8px 16px;

    border: 0;
    font-size: 14px;
    line-height: 24px;
    border-radius: 8px;
    cursor: pointer;
  }

  button:hover {
    background-color: #0069d9;
  }

  .popover-trigger {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .popover-contents {
    border: 1px solid black;
    border-radius: 4px;

    padding: 8px;
  }

  .space-between {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    flex-flow: column;
  }

</style>
