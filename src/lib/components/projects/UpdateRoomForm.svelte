<!-- src/lib/components/projects/UpdateRoomForm.svelte -->
<script lang="ts">
  import * as Card from "@components/ui/card";
  import * as Form from "@components/ui/form";
  import { Button } from "@components/ui/button";
  import { Input } from "@components/ui/input";
  import { Textarea } from "@components/ui/textarea";
  import { type RoomSchema } from "@routes/settings/zod";
  import type { FormPath, Infer, SuperForm } from "sveltekit-superforms";
  import Trash from "lucide-svelte/icons/trash";
  import { Separator } from "@components/ui/separator";
  import PlusCircle from "lucide-svelte/icons/plus-circle";
  import { Badge } from "@components/ui/badge";
  import type { Room } from "@db/schema";

  let {
    form,
    roomId,
    room,
  }: {
    form: SuperForm<Infer<RoomSchema>>;
    roomId: string;
    room: Room;
  } = $props();

  const { form: formData, enhance, submitting } = form;

  // Initialize form data once on mount
  let initialized = $state(false);

  function addBox() {
    formData.update(($formData) => ({
      ...$formData,
      boxes: [
        ...($formData.boxes || []),
        {
          boxId: undefined,
          items: [{ name: "", quantity: 1 }],
          notes: null,
          qrCode: null,
        },
      ],
    }));
  }

  function removeBox(index: number) {
    formData.update(($formData) => {
      const updatedBoxes = [...($formData.boxes || [])];
      updatedBoxes.splice(index, 1);
      return {
        ...$formData,
        boxes: updatedBoxes,
      };
    });
  }

  // Single initialization effect
  $effect(() => {
    if (!initialized && room?.boxes) {
      initialized = true;

      const initialData = {
        roomId,
        name: room.name,
        colorCode: room.colorCode,
        boxes: room.boxes.map((box) => ({
          boxId: box.id,
          items: box.items?.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity ?? 1,
          })) || [{ name: "", quantity: 1 }],
          notes: box.notes,
          qrCode: box.qrCode
            ? {
                id: box.qrCode.id,
                url: box.qrCode.url,
                isAssigned: box.qrCode.isAssigned ?? false,
              }
            : null,
        })),
      };

      formData.set(initialData);
    }
  });
</script>

<Card.Root>
  <form method="POST" action="?/update-room" use:enhance>
    <Form.Field {form} name="roomId">
      <Form.Control let:attrs>
        <input type="hidden" value={roomId} {...attrs} />
      </Form.Control>
    </Form.Field>

    <Card.Content class="space-y-6">
      <div class="grid md:grid-cols-2 gap-4">
        <Form.Field {form} name="name">
          <Form.Control let:attrs>
            <div class="space-y-2">
              <Form.Label>Room Name</Form.Label>
              <Input
                bind:value={$formData.name}
                placeholder="e.g. Living Room"
                {...attrs}
              />
              <Form.FieldErrors class="max-md:text-xs" />
              <Form.Description class="sr-only">
                Choose a name for the room
              </Form.Description>
            </div>
          </Form.Control>
        </Form.Field>

        <Form.Field {form} name="colorCode">
          <Form.Control let:attrs>
            <div class="space-y-2">
              <Form.Label>Room Color</Form.Label>
              <Input
                type="color"
                bind:value={$formData.colorCode}
                class="h-10 p-0 cursor-pointer"
                {...attrs}
              />
              <Form.FieldErrors class="max-md:text-xs" />
              <Form.Description class="sr-only">
                Choose a color for the room
              </Form.Description>
            </div>
          </Form.Control>
        </Form.Field>
      </div>

      <Separator />

      <div class="space-y-4">
        <div class="text-lg font-medium">Boxes</div>

        {#if $formData.boxes?.length === 0}
          <div class="text-center py-4 text-muted-foreground">
            No boxes in this room yet.
          </div>
        {/if}

        {#each $formData.boxes || [] as box, i (box.boxId)}
          <Form.Field
            {form}
            name={`boxes.${i}.boxId` as FormPath<Infer<RoomSchema>>}
          >
            <Form.Control let:attrs>
              {#if $formData.boxes?.[i]}
                <input
                  type="hidden"
                  bind:value={$formData.boxes[i].boxId}
                  {...attrs}
                />
              {/if}
            </Form.Control>
          </Form.Field>

          <div class="border rounded-lg p-4 space-y-4">
            <div class="flex justify-between items-start gap-2">
              <div class="flex items-center justify-between w-full gap-2">
                <h4 class="font-medium">Box {i + 1}</h4>
                {#if box.qrCode}
                  <Badge variant="outline" class="text-xs">
                    QR #<span class="truncate max-w-16">{box.qrCode.id}</span>
                  </Badge>
                {/if}
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                on:click={() => removeBox(i)}
                class="h-8 w-8"
              >
                <Trash class="h-4 w-4" />
              </Button>
            </div>

            <Form.Field
              {form}
              name={`boxes.${i}.notes` as FormPath<Infer<RoomSchema>>}
            >
              <Form.Control let:attrs>
                <div class="space-y-2">
                  <Form.Label>Notes</Form.Label>
                  {#if $formData.boxes?.[i]}
                    <Textarea
                      bind:value={$formData.boxes[i].notes}
                      placeholder="Add notes about this box's contents..."
                      {...attrs}
                    />
                  {/if}
                  <Form.FieldErrors class="max-md:text-xs" />
                  <Form.Description class="sr-only">
                    Add notes about this box's contents
                  </Form.Description>
                </div>
              </Form.Control>
            </Form.Field>

            {#if !box.qrCode}
              <div class="flex justify-end">
                <Button
                  type="submit"
                  name="generateQr"
                  value={i.toString()}
                  variant="outline"
                  size="sm"
                >
                  Generate QR Code
                </Button>
              </div>
            {/if}
          </div>

          {#if $formData.boxes && i < $formData.boxes.length - 1}
            <Separator />
          {/if}
        {/each}

        <Button
          type="button"
          variant="outline"
          size="sm"
          class="w-full flex items-center justify-center gap-2"
          on:click={addBox}
        >
          Add Box
          <PlusCircle size={16} />
        </Button>
      </div>
    </Card.Content>

    <Card.Footer class="justify-end">
      <Button type="submit" disabled={$submitting}>
        {$submitting ? "Updating..." : "Save Changes"}
      </Button>
    </Card.Footer>
  </form>
</Card.Root>
