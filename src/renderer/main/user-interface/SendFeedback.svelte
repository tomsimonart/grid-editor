<script>
  import { modal } from "./../modals/modal.store";
  import { createEventDispatcher } from "svelte";

  import { appSettings } from "../../runtime/app-helper.store";
  import Feedback from "../modals/Feedback.svelte";

  const dispatch = createEventDispatcher();

  export let feedback_context;

  function openFeedbackFrom(arg) {
    console.log("feedback on " + feedback_context);

    modal.show({ component: Feedback });
    $appSettings.feedback_context = feedback_context;
  }
</script>

<button on:click={openFeedbackFrom} class="{$$props.class} feedback">
  Send Feedback
</button>

<style>
  .feedback:hover {
    cursor: pointer;
    text-decoration: underline;
  }
</style>
