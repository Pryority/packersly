<!-- src/lib/components/projects/CreateBoxSheet.svelte -->
<script lang="ts">
  import * as Sheet from "@components/ui/sheet";
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

<Sheet.Root bind:open>
  <Sheet.Content side="bottom" class="md:hidden max-h-[80vh] overflow-y-auto">
    <Sheet.Header class="mb-4">
      <Sheet.Title>Add a Box to Room</Sheet.Title>
      <Sheet.Description class="flex flex-col gap-4 text-xs">
        Update your room. Add boxes with items for easy organization.<br />
        <span class="flex justify-between">
          <span class="flex items-center gap-2">
            <strong class="max-md:text-xs md:hidden">Room:</strong>
            <span class="mad-md:text-xs">
              {roomDetails.name}
            </span>
          </span>
          <span class="flex items-center gap-2">
            <strong class="max-md:text-xs">Color:</strong>
            <span
              class="h-4 w-4 rounded-sm"
              style={`background-color: ${roomDetails.colorCode}`}
            ></span>
            <span class="mad-md:text-xs">
              {roomDetails.colorCode}
            </span>
          </span>
        </span>
      </Sheet.Description>
    </Sheet.Header>
    <CreateBoxForm {form} />
  </Sheet.Content>
</Sheet.Root>
