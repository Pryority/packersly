<!-- src/lib/components/projects/CreateBoxDialog.svelte -->
<script lang="ts">
  import * as Dialog from "@components/ui/dialog";
  import type { SuperForm } from "sveltekit-superforms";
  import type { Infer } from "sveltekit-superforms";
  import type { BoxSchema } from "@routes/settings/zod";
  import CreateBoxForm from "./CreateBoxForm.svelte";

  let {
    open = $bindable(false),
    form,
    roomDetails,
  }: {
    open: boolean;
    form: SuperForm<Infer<BoxSchema>>;
    roomDetails: { name: string; colorCode: string };
  } = $props();
</script>

{#if open}
  <Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen}>
    <Dialog.Portal class="hidden md:block">
      <Dialog.Overlay
        class="bg-background/80 backdrop-blur-sm animate-in fade-in"
      />
      <Dialog.Content class="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <Dialog.Header class="top-0 z-10 pb-4 max-w-fit">
          <Dialog.Title>Add a Box to Room</Dialog.Title>
          <Dialog.Description class="flex flex-col gap-4">
            Update your room. Add boxes with items for easy organization.
            <span class="flex items-center gap-2">
              <strong class="max-md:text-xs">Room Name:</strong>
              <span class="mad-md:text-xs">
                {roomDetails.name}
              </span>
            </span>
            <span class="flex items-center gap-2">
              <strong class="max-md:text-xs">Room Color Code:</strong>
              <span
                class="h-4 w-4 rounded-sm"
                style={`background-color: ${roomDetails.colorCode}`}
              ></span>
              <span class="mad-md:text-xs">
                {roomDetails.colorCode}
              </span>
            </span>
          </Dialog.Description>
        </Dialog.Header>
        <div>
          <CreateBoxForm {form} />
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
{/if}
