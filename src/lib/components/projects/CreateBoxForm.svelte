<!-- src/lib/components/projects/CreateBoxForm.svelte -->
<script lang="ts">
  import * as Card from "@components/ui/card";
  import * as Form from "@components/ui/form";
  import { Button } from "@components/ui/button";
  import { Input } from "@components/ui/input";
  import Label from "@components/ui/label/label.svelte";
  import {
    type FormPath,
    type Infer,
    type SuperForm,
  } from "sveltekit-superforms";
  import Trash from "lucide-svelte/icons/trash";
  import { Separator } from "@components/ui/separator";
  import boxSchema from "@routes/settings/zod/boxSchema";
  import type { BoxSchema } from "@routes/settings/zod";
  import PlusCircle from "lucide-svelte/icons/plus-circle";

  const { form }: { form: SuperForm<Infer<BoxSchema>> } = $props();

  const { form: formData, enhance, submitting } = form;

  function addItem() {
    formData.update(($formData) => ({
      ...$formData,
      items: [...($formData.items || []), { name: "", quantity: 1 }],
    }));
  }

  function removeItem(index: number) {
    formData.update(($formData) => ({
      ...$formData,
      items: $formData.items?.filter((_, i) => i !== index),
    }));
  }

  $effect(() => {
    if ($formData.items?.length === 0) {
      formData.update(($formData) => ({
        ...$formData,
        items: [{ name: "", quantity: 1 }],
      }));
    }
  });
</script>

<Card.Root>
  <form method="POST" action="?/create-box" use:enhance>
    <Card.Content class="space-y-6">
      <div class="flex flex-col items-center space-y-4">
        <div class="w-full">
          <Label class="text-lg">Items in Box</Label>
        </div>

        {#if $formData.items}
          {#each $formData.items as item, i}
            <div class="flex flex-col items-center space-y-4 w-full">
              <div class="grid md:grid-cols-12 gap-4 w-full">
                <!-- Item Name -->
                <Form.Field
                  {form}
                  name={`items.${i}.name` as FormPath<Infer<typeof boxSchema>>}
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
                  name={`items.${i}.quantity` as FormPath<
                    Infer<typeof boxSchema>
                  >}
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
      </div>
    </Card.Content>

    <Card.Footer class="flex flex-col sm:flex-row justify-between gap-4 mt-6">
      <p class="text-sm text-muted-foreground order-2 sm:order-1">
        {$formData.items?.length || 0} item{$formData.items?.length === 1
          ? ""
          : "s"} in box
      </p>
      <Button
        type="submit"
        class="w-full sm:w-auto order-1 sm:order-2"
        disabled={$submitting || !$formData.items?.length}
      >
        {$submitting ? "Creating..." : "Create Box"}
      </Button>
    </Card.Footer>
  </form>
</Card.Root>
<!--
<Dialog.Root bind:open={errorDialogOpen}>
    <Dialog.Portal>
        <Dialog.Overlay class="bg-background/80 backdrop-blur-sm" />
        <Dialog.Content class="sm:max-w-[425px]">
            <Dialog.Header>
                <Dialog.Title class="flex items-center gap-2">
                    <AlertCircle class="h-5 w-5 text-destructive" />
                    Form Errors
                </Dialog.Title>
            </Dialog.Header>
            <div class="py-6">
                <ul class="list-disc pl-6 space-y-2">
                    {#each getFormattedErrors() as error}
                        <li class="text-sm text-destructive">{error}</li>
                    {/each}
                </ul>
            </div>
            <Dialog.Footer>
                <Button
                    variant="outline"
                    on:click={() => (errorDialogOpen = false)}
                >
                    Close
                </Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root> -->
