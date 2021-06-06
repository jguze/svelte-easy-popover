<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import Popover from "../Popover.svelte";

</script>

<Meta
  title="Example/Popover"
  component={Popover}
  argTypes={{
    name: { control: "text" },
    primary: { control: "boolean" },
    backgroundColor: { control: "color" },
    size: {
      control: { type: "select", options: ["small", "medium", "large"] },
    },
    onClick: { action: "onClick" },
  }}
/>

<Template let:args>
  <Popover {...args} />
</Template>

<Story
  name="Primary"
  args={{
    name: "Primary",
  }}
/>
