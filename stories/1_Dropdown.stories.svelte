<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import Popover from "../src/Popover.svelte";
  import { fade } from "svelte/transition";
  import Chevron from "./story-components/Chevron.svelte";

  let referenceElement;
  let isPopoverOpen;

</script>

<Meta
  title="Examples/Dropdown"
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

Use the popover as a dropdown!

<Template let:args id="BasicDropdown">
  <button class="popover-trigger" bind:this={referenceElement}>
    <span>Menu</span>
    <Chevron direction={isPopoverOpen ? "up" : "down"} />
  </button>
  <Popover
    {...args}
    {referenceElement}
    on:change={({ detail: { isOpen } }) => (isPopoverOpen = isOpen)}
  >
    <ul class="popover-contents" transition:fade={{ duration: 250 }}>
      <li><a href="https://example.com">Menu Option 1</a></li>
      <li><a href="https://example.com">Menu Option 2</a></li>
      <li><a href="https://example.com">Menu Option 3</a></li>
    </ul>
  </Popover>
</Template>

<Story
  name="Simple dropdown"
  template="BasicDropdown"
  args={{ triggerEvents: ["click"], spaceAway: 10 }}
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

    display: flex;
    flex-direction: row;
    align-items: center;

    font-size: 16px;
  }

  .popover-contents {
    border-radius: 4px;
    border: 1px solid #f5f6f7;

    padding: 16px;

    list-style: none;
    margin: 0;

    box-shadow: 0px 8px 40px rgba(0, 0, 0, 0.04),
      0px 6px 20px rgba(0, 0, 0, 0.04), 0px 2px 6px rgba(0, 0, 0, 0.04);
  }

  a {
    text-decoration: none;
    color: black;
  }

  li {
    padding: 8px;
    border-radius: 4px;
  }

  li:hover {
    background-color: #f5f6f7;
  }

</style>
