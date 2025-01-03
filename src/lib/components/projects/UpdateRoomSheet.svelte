<!-- src/lib/components/projects/UpdateRoomSheet.svelte -->
<script lang="ts">
  import * as Sheet from "@components/ui/sheet";
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

<Sheet.Root bind:open onOpenChange={(isOpen) => !isOpen}>
  <Sheet.Content side="bottom" class="md:hidden max-h-[90vh]  overflow-y-auto">
    <Sheet.Header class="mb-4">
      <Sheet.Title>Update Room</Sheet.Title>
      <Sheet.Description class="text-xs">
        Create or delete boxes for this room.
      </Sheet.Description>
    </Sheet.Header>
    <UpdateRoomForm {form} {room} {roomId} />
  </Sheet.Content>
</Sheet.Root>
