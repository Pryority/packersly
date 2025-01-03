<!-- src/lib/components/projects/UpdateRoomDialog.svelte -->
<script lang="ts">
  import * as Dialog from "@components/ui/dialog";
  import type { SuperForm } from "sveltekit-superforms";
  import type { Infer } from "sveltekit-superforms";
  import type { RoomSchema } from "@routes/settings/zod";
  import UpdateRoomForm from "./UpdateRoomForm.svelte";
  import type { Room } from "@db/schema";

  let {
    open = $bindable(false),
    form,
    roomId,
    room,
  }: {
    open: boolean;
    form: SuperForm<Infer<RoomSchema>>;
    roomId: string;
    room: Room;
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
          <Dialog.Title>Update Room</Dialog.Title>
          <Dialog.Description>
            Create or delete boxes for this room.
          </Dialog.Description>
        </Dialog.Header>
        <UpdateRoomForm {form} {room} {roomId} />
        <Dialog.Close class="absolute right-4 top-4" />
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
{/if}
