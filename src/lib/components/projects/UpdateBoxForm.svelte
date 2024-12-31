<!-- src/lib/components/projects/UpdateBoxForm.svelte -->
<script lang="ts">
  import * as Card from "@components/ui/card";
  import * as Form from "@components/ui/form";
  import { Button } from "@components/ui/button";
  import { Input } from "@components/ui/input";
  import { type BoxSchema } from "@routes/settings/zod";
  import type {
    FormPath,
    Infer,
    SuperForm,
    SuperValidated,
  } from "sveltekit-superforms";
  import Trash from "lucide-svelte/icons/trash";
  import { Separator } from "@components/ui/separator";
  import PlusCircle from "lucide-svelte/icons/plus-circle";
  import { invalidate } from "$app/navigation";
  import type { ActionResult, SubmitFunction } from "@sveltejs/kit";

  let {
    form,
    boxId,
    box,
  }: {
    form: SuperForm<Infer<BoxSchema>>;
    boxId: string;
    box: {
      items: Array<{
        id: string;
        name: string;
        quantity: number;
      }>;
    };
  } = $props();

  const { form: formData, enhance, submitting } = form;

  function addItem() {
    formData.update(($formData) => ({
      ...$formData,
      items: [
        ...$formData.items,
        { id: crypto.randomUUID(), name: "", quantity: 1 },
      ],
    }));
  }

  function removeItem(index: number) {
    formData.update(($formData) => ({
      ...$formData,
      items: $formData.items.filter((_, i) => i !== index),
    }));
  }

  $effect(() => {
    if ($formData.items.length === 0) {
      formData.update(($formData) => ({
        ...$formData,
        items: [
          ...$formData.items,
          { id: crypto.randomUUID(), name: "", quantity: 1 },
        ],
      }));
    }
  });
  $effect(() => {
    $formData.items = box.items.map((item) => ({
      id: item.id, // Make sure id is included
      name: item.name,
      quantity: item.quantity,
    }));
  });
  $effect(() => {
    $formData.boxId = boxId;
  });
</script>

<Card.Root>
  <form method="POST" action="?/update-box" use:enhance>
    <Form.Field {form} name="boxId">
      <Form.Control let:attrs>
        <input type="hidden" value={boxId} {...attrs} />
      </Form.Control>
    </Form.Field>
    <Card.Content class="space-y-4">
      {#if $formData.items}
        {#each $formData.items as item, i}
          <Form.Field
            {form}
            name={`items.${i}.id` as FormPath<Infer<BoxSchema>>}
          >
            <Form.Control let:attrs>
              <input
                type="hidden"
                bind:value={$formData.items[i].id}
                {...attrs}
              />
            </Form.Control>
          </Form.Field>
          <div class="flex flex-col items-center space-y-4 w-full">
            <div class="grid md:grid-cols-12 gap-4 w-full">
              <!-- Item Name -->
              <Form.Field
                {form}
                name={`items.${i}.name` as FormPath<Infer<BoxSchema>>}
                class="md:col-span-8"
              >
                <Form.Control let:attrs>
                  <div class="space-y-2">
                    <Form.Label>Item {i + 1} Name</Form.Label>
                    <Input
                      bind:value={$formData.items[i].name}
                      placeholder="e.g. T-Shirts, Plates, Snowboard"
                      {...attrs}
                    />
                    <Form.FieldErrors />
                  </div>
                </Form.Control>
              </Form.Field>

              <!-- Quantity -->
              <Form.Field
                {form}
                name={`items.${i}.quantity` as FormPath<Infer<BoxSchema>>}
                class="md:col-span-3"
              >
                <Form.Control let:attrs>
                  <div class="space-y-2">
                    <Form.Label>Quantity</Form.Label>
                    <Input
                      type="number"
                      pattern="[0-9]*"
                      bind:value={$formData.items[i].quantity}
                      {...attrs}
                      placeholder="Quantity"
                      min="1"
                    />
                    <Form.FieldErrors />
                  </div>
                </Form.Control>
              </Form.Field>
              <div class="flex justify-center md:col-span-1 w-full">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  on:click={() => removeItem(i)}
                  disabled={$formData.items.length === 1}
                  class="max-md:w-32 md:h-10 md:w-10 max-md:flex self-end mb-2 max-md:gap-2"
                >
                  <span class="md:hidden">Delete Item {i + 1}</span>
                  <Trash class="h-4 w-4 md:h-8 md:w-8" />
                </Button>
              </div>
            </div>

            {#if i < $formData.items.length - 1}
              <Separator class="my-6" />
            {/if}
          </div>
          <Separator />
        {/each}
      {/if}

      <Button
        type="button"
        size="sm"
        variant="outline"
        class="flex items-center gap-2"
        on:click={addItem}
      >
        Add Item
        <PlusCircle size={16} />
      </Button>
    </Card.Content>

    <Card.Footer class="justify-end">
      <Button type="submit" disabled={$submitting}>
        {$submitting ? "Updating..." : "Confirm Update"}
      </Button>
    </Card.Footer>
  </form>
</Card.Root>
