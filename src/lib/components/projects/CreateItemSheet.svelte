<!-- src/lib/components/projects/CreateItemSheet.svelte -->
<script lang="ts">
  import * as Sheet from "@components/ui/sheet";
  import type { SuperForm } from "sveltekit-superforms";
  import type { Infer } from "sveltekit-superforms";
  import type { ItemSchema } from "@routes/settings/zod";
  import CreateItemForm from "./CreateItemForm.svelte";

  let {
    open = $bindable(false),
    form,
  }: {
    open: boolean;
    form: SuperForm<Infer<ItemSchema>>;
  } = $props();
</script>

{#if open}
  <Sheet.Root bind:open>
    <Sheet.Content side="bottom" class="md:hidden max-h-[90vh] overflow-y-auto">
      <Sheet.Header class="mb-4">
        <Sheet.Title>Create New Item</Sheet.Title>
        <Sheet.Description class="text-xs">
          Adding items to boxes will help you stay organized.
        </Sheet.Description>
      </Sheet.Header>
      <CreateItemForm {form} />
      <Sheet.Close class="absolute right-4 top-4" />
    </Sheet.Content>
  </Sheet.Root>
{/if}
