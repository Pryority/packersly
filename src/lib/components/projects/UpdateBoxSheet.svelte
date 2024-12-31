<!-- src/lib/components/projects/UpdateBoxSheet.svelte -->
<script lang="ts">
  import * as Sheet from "@components/ui/sheet";
  import UpdateBoxForm from "@components/projects/UpdateBoxForm.svelte";
  import type { SuperForm } from "sveltekit-superforms";
  import type { Infer } from "sveltekit-superforms";
  import type { BoxSchema } from "@routes/settings/zod";
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

<Sheet.Root bind:open onOpenChange={(isOpen) => !isOpen}>
  <Sheet.Content side="bottom" class="md:hidden max-h-[90vh]  overflow-y-auto">
    <Sheet.Header class="mb-4">
      <Sheet.Title>Update Box</Sheet.Title>
      <Sheet.Description class="text-xs">
        Change the items in this box.
      </Sheet.Description>
    </Sheet.Header>
    <UpdateBoxForm {form} {box} {boxId} />
  </Sheet.Content>
</Sheet.Root>
