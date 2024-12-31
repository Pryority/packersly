<!-- src/lib/components/projects/UpdateBoxDialog.svelte -->
<script lang="ts">
  import * as Dialog from "@components/ui/dialog";
  import type { SuperForm } from "sveltekit-superforms";
  import type { Infer } from "sveltekit-superforms";
  import type { BoxSchema } from "@routes/settings/zod";
  import UpdateBoxForm from "./UpdateBoxForm.svelte";

  let {
    boxId,
    open = $bindable(false),
    form,
    box,
  }: {
    boxId: string;
    open: boolean;
    form: SuperForm<Infer<BoxSchema>>;
    box: {
      items: Array<{
        id: string;
        name: string;
        quantity: number;
      }>;
    };
  } = $props();
</script>

{#if open}
  <Dialog.Root bind:open>
    <Dialog.Portal>
      <Dialog.Overlay
        class="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"
      />
      <Dialog.Content
        class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] sm:max-w-[625px] max-h-[90vh] overflow-y-auto w-full md:w-full p-6 bg-background shadow-lg"
      >
        <Dialog.Header class="top-0 z-10 pb-4 w-fit">
          <Dialog.Title>Update Project</Dialog.Title>
          <Dialog.Description>
            Update information about this moving project.
          </Dialog.Description>
        </Dialog.Header>
        <UpdateBoxForm {form} {box} {boxId} />
        <Dialog.Close class="absolute right-4 top-4" />
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
{/if}
