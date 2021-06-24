<script lang="ts">
  export let direction: "left" | "right" | "up" | "down" = "down";

</script>

<svg
  class={direction}
  width="24px"
  height="24px"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg
>

<style>
  .left {
    transform: rotate(90deg);
  }

  .right {
    transform: rotate(270deg);
  }

  .up {
    transform: rotate(180deg);
  }

  .down {
    transform: rotate(0deg);
  }

</style>
