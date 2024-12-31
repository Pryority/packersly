<!-- src/routes/project/[handle]/+page.svelte -->
<script lang="ts">
  import * as DropdownMenu from "@components/ui/dropdown-menu";
  import { Button } from "@components/ui/button/index.js";
  import * as Card from "@components/ui/card/index.js";
  import * as Table from "@components/ui/table/index.js";
  import { page } from "$app/stores";
  import {
    projectSchema,
    roomSchema,
    type ProjectSchema,
    type RoomSchema,
  } from "@routes/settings/zod";
  import {
    type SuperValidated,
    type Infer,
    superForm,
  } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { goto } from "$app/navigation";
  import type { ProjectBasic, RoomWithRelations } from "@types";
  import { cn, getTotalItemsOfBoxes } from "@utils";
  import type { ActionResult } from "@sveltejs/kit";
  import UpdateProjectDialog from "@components/projects/UpdateProjectDialog.svelte";
  import EllipsisVertical from "lucide-svelte/icons/ellipsis-vertical";
  import UpdateProjectSheet from "@components/projects/UpdateProjectSheet.svelte";
  import CreateRoomSheet from "@components/projects/CreateRoomSheet.svelte";
  import CreateRoomDialog from "@components/projects/CreateRoomDialog.svelte";

  const {
    data,
  }: {
    data: {
      project: ProjectBasic;
      form: SuperValidated<Infer<RoomSchema>>;
      projectUpdateForm: SuperValidated<Infer<ProjectSchema>>;
      rooms: RoomWithRelations[];
    };
  } = $props();

  const {
    project,
    form: roomFormData,
    projectUpdateForm: projectUpdateFormData,
    rooms,
  } = data;

  // State for UI controls
  let createDialogOpen = $state(false);
  let updateDialogOpen = $state(false);
  let createSheetOpen = $state(false);
  let updateSheetOpen = $state(false);
  let submittingRoom = $state(false);
  let submittingUpdate = $state(false);

  const form = superForm(roomFormData, {
    id: "room-form",
    validators: zodClient(roomSchema),
    dataType: "json",
    taintedMessage: null,
    onSubmit: ({ cancel }) => {
      submittingRoom = true;
      return async ({ result }: { result: ActionResult }) => {
        if (result.type === "error" || result.type === "failure") {
          submittingRoom = false;
          createDialogOpen = false;
          createSheetOpen = false;
          cancel();
        }
        // Don't handle redirect here - let SvelteKit handle it
      };
    },
    onError: () => {
      submittingRoom = false;
    },
    onResult: () => {
      submittingRoom = false;
    },
  });

  const projectUpdateForm = superForm(projectUpdateFormData, {
    id: "project-update-form",
    validators: zodClient(projectSchema),
    dataType: "json",
    taintedMessage: null,
    onSubmit: ({ cancel }) => {
      submittingUpdate = true;
      return async ({ result }: { result: ActionResult }) => {
        if (result.type === "error" || result.type === "failure") {
          submittingUpdate = false;
          cancel();
        }
        // Don't handle redirect here - let SvelteKit handle it
      };
    },
    onError: () => {
      submittingUpdate = false;
    },
    onResult: () => {
      submittingUpdate = false;
      updateDialogOpen = false;
      updateSheetOpen = false;
    },
  });

  function openCreateForm() {
    const isMobile = window.innerWidth < 768;
    createDialogOpen = !isMobile;
    createSheetOpen = isMobile;
  }
  function openUpdateForm() {
    const isMobile = window.innerWidth < 768;
    updateDialogOpen = !isMobile;
    updateSheetOpen = isMobile;
  }
</script>

<Card.Root class="m-4">
  <Card.Header
    class={cn(
      "flex flex-row items-center justify-between w-full",
      rooms && rooms.length === 0 ? "pb-4" : "",
    )}
  >
    <div class="flex flex-col gap-1 w-fit">
      <Card.Title class="flex items-center">{project.name}</Card.Title>
      <Card.Description class="max-md:text-xs">
        Manage rooms for this project.
      </Card.Description>
    </div>

    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          size="icon"
          variant="outline"
          class="h-8 w-8 md:h-10 md:w-10"
        >
          <EllipsisVertical class="h-4 w-4" />
          <span class="sr-only">Open menu</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item on:click={openUpdateForm}>
          Edit Project
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item class="text-destructive focus:text-destructive">
          Delete Project
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Card.Header>
  {#if rooms.length && rooms.length > 0}
    <Card.Content>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="md:w-16">Colour</Table.Head>
            <Table.Head class="whitespace-nowrap">Room Name</Table.Head>
            <Table.Head class="max-md:text-center">Boxes</Table.Head>
            <Table.Head class="max-md:text-center">Items</Table.Head>
            <!-- <Table.Head>
                        <span class="sr-only">Actions</span>
                    </Table.Head> -->
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rooms as room}
            <Table.Row
              data-sveltekit-preload-code="eager"
              on:click={() => goto(`${$page.url.pathname}/room/${room.handle}`)}
            >
              <Table.Cell class="w-fit bg-red-500x">
                <div class="flex flex-col items-center gap-1">
                  <div
                    class="w-8 md:w-12 aspect-square rounded-sm"
                    style={`background-color: ${room.colorCode};`}
                  ></div>
                  <span class="text-[8px]"> {room.colorCode}</span>
                </div>
              </Table.Cell>
              <Table.Cell
                class="md:text-lg md:max-w-24 md:truncate whitespace-nowrap"
                >{room.name}</Table.Cell
              >

              <Table.Cell>
                <span class="text-center md:text-start md:text-lg">
                  {#if room.boxes}
                    {room.boxes.length}
                  {:else}
                    0
                  {/if}
                </span>
              </Table.Cell>

              <Table.Cell>
                <span class="text-center md:text-start md:text-lg">
                  {getTotalItemsOfBoxes(room.boxes)}
                </span>
              </Table.Cell>

              <!-- <Table.Cell>
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild let:builder>
                                    <Button
                                        aria-haspopup="true"
                                        size="icon"
                                        variant="ghost"
                                        builders={[builder]}
                                    >
                                        <Ellipsis class="h-4 w-4" />
                                        <span class="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content align="end">
                                    <DropdownMenu.Label
                                        >Actions</DropdownMenu.Label
                                    >
                                    <DropdownMenu.Item>
                                        <a
                                            href={`${$page.url.pathname}/box/${box.id}`}
                                        >
                                            View
                                        </a>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item>Edit</DropdownMenu.Item>
                                    <DropdownMenu.Item>Delete</DropdownMenu.Item
                                    >
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </Table.Cell> -->
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </Card.Content>
    <Card.Footer>
      <div class="text-muted-foreground text-xs">
        Showing <strong>
          {rooms.length}
        </strong>
        {#if rooms.length === 1}
          room
        {:else}
          rooms
        {/if}
      </div>
    </Card.Footer>
  {/if}
</Card.Root>

<Button
  type="button"
  on:click={openCreateForm}
  class="sticky bottom-2 mx-8 md:mx-[40vw]"
>
  Create a Room
</Button>

<CreateRoomDialog open={createDialogOpen} {form} submitting={submittingRoom} />
<CreateRoomSheet open={createSheetOpen} {form} submitting={submittingRoom} />

<UpdateProjectDialog
  projectId={project.id}
  open={updateDialogOpen}
  form={projectUpdateForm}
  submitting={submittingUpdate}
/>

<UpdateProjectSheet
  projectId={project.id}
  open={updateSheetOpen}
  form={projectUpdateForm}
  submitting={submittingUpdate}
/>
