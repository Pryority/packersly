<!-- src/lib/components/projects/UpdateProjectForm.svelte -->
<script lang="ts">
  import * as Card from "@components/ui/card";
  import * as Form from "@components/ui/form";
  import * as Tabs from "@components/ui/tabs";
  import { Button } from "@components/ui/button";
  import { Input } from "@components/ui/input";
  import Label from "@components/ui/label/label.svelte";
  import { projectSchema, type ProjectSchema } from "@routes/settings/zod";
  import {
    type FormPath,
    type Infer,
    type SuperForm,
  } from "sveltekit-superforms";
  import Trash from "lucide-svelte/icons/trash";
  import { Separator } from "@components/ui/separator";
  import PlusCircle from "lucide-svelte/icons/plus-circle";
  import { page } from "$app/stores";
  import { generateUUID } from "@utils";

  let {
    form,
    projectId,
  }: {
    form: SuperForm<Infer<ProjectSchema>>;
    projectId: string;
  } = $props();

  const { form: formData, enhance, submitting } = form;
  const statusOptions = [
    {
      value: "draft",
      label: "Draft",
      description: "Project is in planning phase",
    },
    { value: "active", label: "Active", description: "Currently moving" },
    { value: "completed", label: "Completed", description: "Move completed" },
  ];

  function addRoom() {
    formData.update(($formData) => ({
      ...$formData,
      rooms: [
        ...($formData.rooms || []),
        { name: "", colorCode: "#000000", id: generateUUID() },
      ],
    }));
  }

  function removeRoom(index: number) {
    formData.update(($formData) => ({
      ...$formData,
      rooms: $formData.rooms.filter((_, i) => i !== index),
    }));
  }

  function handleStatusChange(value: string | undefined) {
    formData.update(($formData) => ({
      ...$formData,
      status: value as "draft" | "active" | "completed",
    }));
  }

  $effect(() => {
    if ($formData.rooms.length === 0) {
      formData.update(($formData) => ({
        ...$formData,
        rooms: [{ name: "", colorCode: "#000000", id: generateUUID() }],
      }));
    }
  });
</script>

<Card.Root>
  <form method="POST" action="?/update-project" use:enhance>
    <input
      type="hidden"
      name="projectHandle"
      value={$page.params.projectHandle}
    />
    <input type="hidden" name="projectId" value={projectId} />
    <Card.Content class="space-y-4">
      <Form.Field {form} name="name">
        <Form.Control let:attrs>
          <Form.Label>Project Name</Form.Label>
          <Input
            bind:value={$formData.name}
            {...attrs}
            placeholder="e.g. New Apartment"
          />
        </Form.Control>
        <Form.Description>
          <span class="hidden md:block">
            Update your moving project's name
          </span>
          <span class="block md:hidden"> Update project name </span>
        </Form.Description>
        <Form.FieldErrors class="max-md:text-xs" />
      </Form.Field>

      <Form.Field {form} name="status">
        <Form.Control let:attrs>
          <Form.Label>Project Status</Form.Label>
          <Tabs.Root
            value={$formData.status}
            onValueChange={handleStatusChange}
            class="w-full"
          >
            <Tabs.List class="grid grid-cols-3 w-full">
              {#each statusOptions as option}
                <Tabs.Trigger
                  value={option.value}
                  class="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {option.label}
                </Tabs.Trigger>
              {/each}
            </Tabs.List>
          </Tabs.Root>
          <Form.Description>
            {statusOptions.find((opt) => opt.value === $formData.status)
              ?.description}
          </Form.Description>
        </Form.Control>
        <Form.FieldErrors class="max-md:text-xs" />
      </Form.Field>

      <Form.Field {form} name="fromAddress">
        <Form.Control let:attrs>
          <Form.Label>Current Address</Form.Label>
          <Input
            bind:value={$formData.fromAddress}
            {...attrs}
            placeholder="e.g. 20 Bremner Blvd."
          />
        </Form.Control>
        <Form.Description>
          Update the address you're moving from
        </Form.Description>
        <Form.FieldErrors class="max-md:text-xs" />
      </Form.Field>

      <Form.Field {form} name="toAddress">
        <Form.Control let:attrs>
          <Form.Label>New Address</Form.Label>
          <Input
            bind:value={$formData.toAddress}
            {...attrs}
            placeholder="e.g. 123 Main Street"
          />
        </Form.Control>
        <Form.Description>Update the address you're moving to</Form.Description>
        <Form.FieldErrors class="max-md:text-xs" />
      </Form.Field>

      <Separator />
      <div class="flex flex-col items-center space-y-2 w-full">
        <Label class="w-full text-lg">Rooms</Label>
        {#each $formData.rooms as room, i}
          <div
            class="flex flex-col md:flex-row md:items-end w-full md:space-x-4 space-y-4 md:space-y-0"
          >
            <Form.Field
              {form}
              name={`rooms.${i}.name` as FormPath<Infer<typeof projectSchema>>}
              class="flex-1"
            >
              <Form.Control let:attrs>
                <div class="w-full">
                  <Form.Label>Room {i + 1} Name</Form.Label>
                  <Input
                    bind:value={$formData.rooms[i].name}
                    placeholder="e.g. Kitchen"
                    {...attrs}
                  />
                  <Form.FieldErrors class="max-md:text-xs" />
                  <Form.Description>Update room name</Form.Description>
                </div>
              </Form.Control>
            </Form.Field>

            <Form.Field
              {form}
              name={`rooms.${i}.colorCode` as FormPath<
                Infer<typeof projectSchema>
              >}
              class="md:w-40"
            >
              <Form.Control let:attrs>
                <div>
                  <Form.Label class="max-md:text-xs whitespace-nowrap">
                    Room Color
                  </Form.Label>
                  <Input
                    type="color"
                    bind:value={$formData.rooms[i].colorCode}
                    class="w-full h-9 md:h-10 p-0 cursor-pointer"
                    {...attrs}
                  />
                  <Form.FieldErrors class="max-md:text-xs" />
                  <Form.Description>Update room color</Form.Description>
                </div>
              </Form.Control>
            </Form.Field>

            <Button
              type="button"
              size="sm"
              variant="destructive"
              on:click={() => removeRoom(i)}
              disabled={$formData.rooms.length === 1}
              class="w-full md:w-10 h-10 flex items-center justify-center md:self-center"
            >
              <span class="md:hidden">Delete Room {i + 1}</span>
              <Trash class="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
          <Separator class="my-4" />
        {/each}
        <Button
          type="button"
          size="sm"
          variant="outline"
          class="flex items-center gap-2"
          on:click={addRoom}
        >
          Add Room
          <PlusCircle size={16} />
        </Button>
      </div>
    </Card.Content>

    <Card.Footer class="justify-end">
      <Button type="submit" disabled={$submitting}>
        {$submitting ? "Updating..." : "Confirm Update"}
      </Button>
    </Card.Footer>
  </form>
</Card.Root>
