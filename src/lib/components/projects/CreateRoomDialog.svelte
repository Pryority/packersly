<!-- src/lib/components/projects/CreateRoomDialog.svelte -->
<script lang="ts">
  import * as Dialog from "@components/ui/dialog";
  import { type RoomSchema } from "@routes/settings/zod";
  import { type Infer, type SuperForm } from "sveltekit-superforms";
  import CreateRoomForm from "@components/projects/CreateRoomForm.svelte";

  let {
    open = $bindable(false),
    form,
  }: {
    open: boolean;
    form: SuperForm<Infer<RoomSchema>>;
  } = $props();
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen}>
  <Dialog.Portal class="hidden md:block">
    <Dialog.Overlay
      class="bg-background/80 backdrop-blur-sm animate-in fade-in"
    />
    <Dialog.Content class="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
      <Dialog.Header class="top-0 max-w-fit z-10 pb-4">
        <Dialog.Title>Create New Room</Dialog.Title>
        <Dialog.Description>
          Update your existing project. Add rooms with boxes with colors and
          items to organize.
        </Dialog.Description>
      </Dialog.Header>
      <div>
        <CreateRoomForm {form} />
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
