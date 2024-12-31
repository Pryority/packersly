<!-- src/lib/components/projects/CreateItemForm.svelte -->
<script lang="ts">
  import * as Card from "@components/ui/card";
  import * as Form from "@components/ui/form";
  import { Button } from "@components/ui/button";
  import { Input } from "@components/ui/input";
  import Label from "@components/ui/label/label.svelte";
  import { type Infer, type SuperForm } from "sveltekit-superforms";
  import type { ItemSchema } from "@routes/settings/zod";

  const { form }: { form: SuperForm<Infer<ItemSchema>> } = $props();

  const { form: formData, enhance, submitting } = form;
</script>

<Card.Root>
  <form method="POST" action="?/create-item" use:enhance>
    <Card.Content class="space-y-6">
      <div class="flex flex-col items-center space-y-4">
        <div class="w-full">
          <Label class="text-lg">Item Details</Label>
        </div>

        <div class="grid md:grid-cols-12 gap-4 w-full">
          <!-- Item Name -->
          <Form.Field {form} name="name" class="md:col-span-8">
            <Form.Control let:attrs>
              <div class="space-y-2">
                <Form.Label>Item Name</Form.Label>
                <Input
                  bind:value={$formData.name}
                  placeholder="e.g. T-Shirt, Plate, Snowboard"
                  disabled={$submitting}
                  {...attrs}
                />
                <Form.FieldErrors />
              </div>
            </Form.Control>
          </Form.Field>

          <!-- Quantity -->
          <Form.Field {form} name="quantity" class="md:col-span-4">
            <Form.Control let:attrs>
              <div class="space-y-2">
                <Form.Label>Quantity</Form.Label>
                <Input
                  type="number"
                  pattern="[0-9]*"
                  bind:value={$formData.quantity}
                  disabled={$submitting}
                  {...attrs}
                  placeholder="Quantity"
                  min="1"
                />
                <Form.FieldErrors />
              </div>
            </Form.Control>
          </Form.Field>
        </div>
      </div>
    </Card.Content>

    <Card.Footer class="flex justify-end gap-4 mt-6">
      <Button type="submit" class="w-full sm:w-auto" disabled={$submitting}>
        {$submitting ? "Creating..." : "Create Item"}
      </Button>
    </Card.Footer>
  </form>
</Card.Root>
