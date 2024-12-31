<!-- src/lib/components/projects/CreateRoomSheet.svelte -->
<script lang="ts">
  import * as Sheet from "@components/ui/sheet";
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

<Sheet.Root bind:open onOpenChange={(isOpen) => !isOpen}>
  <Sheet.Content side="bottom" class="md:hidden max-h-[90vh]  overflow-y-auto">
    <Sheet.Header class="mb-4">
      <Sheet.Title>Create New Room</Sheet.Title>
      <Sheet.Description class="text-xs">
        Update your existing project. Add rooms with boxes with colors and items
        to organize.
      </Sheet.Description>
    </Sheet.Header>
    <CreateRoomForm {form} />
  </Sheet.Content>
</Sheet.Root>
