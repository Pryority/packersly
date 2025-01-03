<!-- src/routes/project/[handle]/room/[handle]/+page.svelte -->
<script lang="ts">
  import { Button } from "@components/ui/button/index.js";
  import * as Card from "@components/ui/card/index.js";
  import * as DropdownMenu from "@components/ui/dropdown-menu";
  import * as Table from "@components/ui/table/index.js";
  import { page } from "$app/stores";
  import type {
    BoxSchema,
    DownloadQrSchema,
    GenerateQrSchema,
    RoomSchema,
  } from "@routes/settings/zod";
  import {
    type SuperValidated,
    type Infer,
    superForm,
  } from "sveltekit-superforms";
  import { goto } from "$app/navigation";
  import { zodClient } from "sveltekit-superforms/adapters";
  import {
    boxSchema,
    downloadQrSchema,
    generateQrSchema,
    roomSchema,
  } from "@routes/settings/zod";
  import { cn, downloadBlob } from "@utils";
  import QRCode from "qrcode";
  import EllipsisVertical from "lucide-svelte/icons/ellipsis-vertical";
  import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
  import Download from "lucide-svelte/icons/download";
  import PlusCircle from "lucide-svelte/icons/plus-circle";
  import type { Room, Box } from "@db/schema";
  import UpdateRoomDialog from "@components/projects/UpdateRoomDialog.svelte";
  import UpdateRoomSheet from "@components/projects/UpdateRoomSheet.svelte";
  import CreateBoxDialog from "@components/projects/CreateBoxDialog.svelte";
  import CreateBoxSheet from "@components/projects/CreateBoxSheet.svelte";

  const {
    data,
  }: {
    data: {
      room: Room & { boxes: Box[] };
      availableQrCodes: number;
      createBoxForm: SuperValidated<Infer<BoxSchema>>;
      generateQrForm: SuperValidated<Infer<GenerateQrSchema>>;
      downloadQrForm: SuperValidated<Infer<DownloadQrSchema>>;
      updateRoomForm: SuperValidated<Infer<RoomSchema>>;
    };
  } = $props();

  // State for UI controls
  let createDialogOpen = $state(false);
  let updateDialogOpen = $state(false);
  let createSheetOpen = $state(false);
  let updateSheetOpen = $state(false);

  let qrCanvases = $state<Record<string, HTMLCanvasElement>>({});
  const availableQrCodes = $derived(data.availableQrCodes);

  // Just get the form from data props
  const updateRoomForm = superForm(data.updateRoomForm, {
    id: "update-room-form",
    validators: zodClient(roomSchema),
    dataType: "json",
    taintedMessage: null,
    timeoutMs: 8000,
    onResult: async ({ result }) => {
      if (result.type === "success") {
        updateDialogOpen = false;
        updateSheetOpen = false;
        // Redirect to the updated room page
        const newHandle = result.data?.form.message.roomHandle;
        console.log(newHandle);
        if (newHandle) {
          await goto(
            `/project/${$page.params.projectHandle}/room/${newHandle}`,
            { invalidateAll: true },
          );
        } else {
          console.error("Missing project handle in response");
        }
      }
    },
  });
  const {
    form: updateRoomFormData,
    submitting: updatingRoom,
    enhance: enhanceUpdateRoom,
  } = updateRoomForm;

  const createBoxForm = superForm(data.createBoxForm, {
    id: "create-box-form",
    validators: zodClient(boxSchema),
    dataType: "json",
    taintedMessage: null,
    timeoutMs: 8000,
    onSubmit: ({ formData, cancel }) => {
      try {
        // Get items data from FormData and structure it properly
        const items = [];
        let i = 0;
        while (formData.has(`items.${i}.name`)) {
          const name = (formData.get(`items.${i}.name`) as string).trim();
          const quantity =
            parseInt(formData.get(`items.${i}.quantity`) as string) || 1;

          // Only add items with a valid name
          if (name.length >= 2) {
            items.push({ name, quantity });
          }
          i++;
        }

        // Validate items array
        if (items.length === 0) {
          throw new Error(
            "At least one item with 2 or more characters is required",
          );
        }

        // Create the submit data WITHOUT boxId - let server generate it
        const submitData = {
          items,
        };

        console.log("Submit Data:", submitData);
        return { data: submitData };
      } catch (error) {
        console.error("Error preparing form data:", error);
        cancel();
        return;
      }
    },
    onResult: async ({ result }) => {
      console.log("Form result:", result);

      if (result.type === "success") {
        createDialogOpen = false;
        createSheetOpen = false;

        const location =
          result.data?.location || result.data?.form?.message?.location;
        if (location) {
          await goto(location);
        } else {
          await goto($page.url.pathname, { replaceState: true });
        }
      } else {
        // Show validation errors to user
        const errors = result.status;
        console.error("Validation errors:", errors);
      }
    },
  });
  const {
    form: createBoxFormData,
    submitting: creatingBox,
    enhance: enhanceCreateBox,
  } = createBoxForm;

  const generateQrForm = superForm(data.generateQrForm, {
    id: "generate-qr-form",
    validators: zodClient(generateQrSchema),
    timeoutMs: 8000,
    dataType: "json",
    onResult: async ({ result }) => {
      console.log("Form result:", result);
      if (result.type === "success") {
        const pdfBlob = new Blob(
          [Uint8Array.from(atob(result.data?.pdf), (c) => c.charCodeAt(0))],
          { type: "application/pdf" },
        );
        downloadBlob(pdfBlob, `${data.room.handle}-qr-codes.pdf`);
        data.availableQrCodes = result.data?.availableQrCodesCount;
      }
    },
  });
  const {
    form: generateQrFormData,
    submitting: generatingQr,
    enhance: enhanceGenerateQr,
  } = generateQrForm;

  const downloadQrForm = superForm(data.downloadQrForm, {
    id: "download-all-qr-form",
    validators: zodClient(downloadQrSchema),
    timeoutMs: 8000,
    dataType: "json",
    onResult: async ({ result }) => {
      if (result.type === "success") {
        const pdfBlob = new Blob(
          [Uint8Array.from(atob(result.data?.pdf), (c) => c.charCodeAt(0))],
          { type: "application/pdf" },
        );
        downloadBlob(pdfBlob, `${data.room.handle}-qr-codes.pdf`);
      }
    },
  });
  const {
    form: downloadQrFormData,
    submitting: downloadingQr,
    enhance: enhanceDownloadQr,
  } = downloadQrForm;

  function openForm() {
    const isMobile = window.innerWidth < 768;
    createDialogOpen = !isMobile;
    createSheetOpen = isMobile;
  }
  function openUpdateForm() {
    const isMobile = window.innerWidth < 768;
    updateDialogOpen = !isMobile;
    updateSheetOpen = isMobile;
  }

  // Initialize form data with defaults
  $effect(() => {
    if ($createBoxFormData && !$createBoxFormData.items?.length) {
      $createBoxFormData = {
        items: [{ name: "", quantity: 1 }],
      };
    }
  });

  $effect(() => {
    if (data.room) {
      $updateRoomFormData = {
        roomId: data.room.id,
        name: data.room.name,
        colorCode: data.room.colorCode,
        boxes: data.room.boxes?.map((box) => ({
          boxId: box.id,
          notes: box.notes,
          items:
            box.items?.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity ?? 1,
            })) || [],
          qrCode: box.qrCode
            ? {
                id: box.qrCode.id,
                url: box.qrCode.url,
                isAssigned: box.qrCode.isAssigned,
              }
            : null,
        })),
      };
    }
  });

  $effect(() => {
    $downloadQrFormData = {
      roomId: data.room.id,
    };
  });

  $effect(() => {
    if (data.room.boxes) {
      data.room.boxes.forEach((box: Box) => {
        if (box.qrCode?.url && qrCanvases[box.id]) {
          QRCode.toCanvas(qrCanvases[box.id], box.qrCode.url, {
            width: 256,
            margin: 0,
            errorCorrectionLevel: "M",
          }).catch((err) => {
            console.error("Error generating QR code:", err);
          });
        }
      });
    }
  });
</script>

<Card.Root class="m-4">
  <Card.Header class="flex flex-row items-center justify-between w-full">
    <div class="flex flex-col gap-1 w-fit">
      <Card.Title>QR Code Management</Card.Title>
      <Card.Description
        >Generate and print QR codes for your boxes</Card.Description
      >
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
          Edit Room
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <form method="POST" action="?/delete-room">
          <input type="hidden" value={data.room.handle} />
          <button type="submit" class="w-full">
            <DropdownMenu.Item class="text-destructive focus:text-destructive">
              Delete Room
            </DropdownMenu.Item>
          </button>
        </form>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Card.Header>

  <Card.Content>
    <div class="flex flex-col gap-4">
      <div
        class="bg-secondary p-4 rounded-lg flex flex-col items-center justify-between gap-4"
      >
        <div class="flex flex-col w-full gap-4">
          <div class="flex max-lg:flex-col items-center justify-between">
            <div class="max-lg:mb-2 max-lg:text-center">
              <p class="text-sm text-muted-foreground">Available QR Codes</p>
              <p class="text-2xl font-bold">{availableQrCodes || 0}</p>
            </div>
            <div
              class="flex max-lg:flex-col max-lg:w-full items-center gap-4 lg:gap-8"
            >
              <form
                method="POST"
                action="?/generate-qr"
                use:enhanceGenerateQr
                class="flex max-lg:flex-col gap-2 max-lg:w-full"
              >
                <input type="hidden" name="roomId" value={data.room.id} />
                <input
                  type="hidden"
                  name="count"
                  value={$generateQrFormData.count}
                />
                <Button
                  variant="outline"
                  on:click={() => {
                    $generateQrFormData = {
                      roomId: data.room.id,
                      count: 5,
                    };
                  }}
                  disabled={$generatingQr}
                  type="submit"
                >
                  Generate 5
                </Button>

                <Button
                  variant="outline"
                  on:click={() => {
                    $generateQrFormData = {
                      roomId: data.room.id,
                      count: 25,
                    };
                  }}
                  disabled={$generatingQr}
                  type="submit"
                >
                  Generate 25
                </Button>

                <Button
                  variant="outline"
                  on:click={() => {
                    $generateQrFormData = {
                      roomId: data.room.id,
                      count: 100,
                    };
                  }}
                  disabled={$generatingQr}
                  type="submit"
                >
                  Generate 100
                </Button>
              </form>
              <form
                method="POST"
                action="?/download-all-generated"
                class="max-lg:w-full"
                use:enhanceDownloadQr
              >
                <input type="hidden" name="roomId" value={data.room.id} />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={$downloadingQr || availableQrCodes === 0}
                  class="relative w-full bg-secondary-foreground text-secondary hover:bg-secondary-foreground/80 hover:text-secondary"
                >
                  <div class="grid place-items-center w-full h-full">
                    <div class="flex items-center gap-2">
                      <p>Download All</p>
                      <Download class="h-4 w-4" />
                      <div
                        class="absolute -top-2 -right-2 bg-background border-2 ring-2 ring-secondary border-primary text-primary rounded-full h-6 w-6 grid place-items-center text-[8px] font-medium"
                      >
                        {availableQrCodes}
                      </div>
                    </div>
                  </div>
                </Button>
              </form>
            </div>
          </div>

          {#if availableQrCodes === 0}
            <Alert variant="destructive">
              <AlertTitle>No QR Codes Available</AlertTitle>
              <AlertDescription class="max-md:text-xs">
                You must generate QR codes before creating a box to track or
                store items.
              </AlertDescription>
            </Alert>
          {:else if availableQrCodes < 10}
            <Alert>
              <AlertDescription>
                Running low on available QR codes. Generate more to ensure you
                have enough for your boxes.
              </AlertDescription>
            </Alert>
          {:else if availableQrCodes > 75}
            <Alert class="border-amber-400">
              <AlertDescription class="text-amber-600">
                You have {availableQrCodes} QR codes available. Consider using existing
                codes before generating more.
              </AlertDescription>
            </Alert>
          {/if}
        </div>
      </div>
    </div></Card.Content
  >
</Card.Root>
<Card.Root class="m-4">
  <Card.Header
    class={cn(data.room.boxes && data.room.boxes.length === 0 ? "pb-4" : "")}
  >
    <Card.Title>{data.room.name}</Card.Title>
    <Card.Description
      >Manage boxes in this room.
      {#if data.room.boxes.length > 0}
        <br />Click on a row in the table to view the box.
      {/if}</Card.Description
    >
  </Card.Header>
  {#if data.room.boxes && data.room.boxes.length > 0}
    <Card.Content>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <!-- <Table.Head>ID</Table.Head> -->
            <Table.Head>QR Code</Table.Head>
            <!-- <Table.Head class="max-md:text-center">Boxes</Table.Head -->

            <Table.Head class="max-md:text-end">Items</Table.Head>
            <!-- <Table.Head>Contents</Table.Head> -->
            <!-- <Table.Head>Notes</Table.Head> -->
            <!-- <Table.Head>
                        <span class="sr-only">Actions</span>
                    </Table.Head> -->
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each data.room.boxes as box}
            <Table.Row
              on:click={() => goto(`${$page.url.pathname}/box/${box.id}`)}
            >
              <Table.Cell>
                <div
                  class="flex justify-center items-center w-16 h-16 md:w-32 md:h-32 p-1 rounded-lg border-2 md:border-8"
                  style={`border-color: ${data.room.colorCode}`}
                >
                  {#if box.qrCode?.url}
                    <canvas
                      bind:this={qrCanvases[box.id]}
                      class="max-w-full max-h-full object-contain"
                    ></canvas>
                  {/if}
                </div>
              </Table.Cell>
              <Table.Cell class="max-md:text-end">
                <span>
                  {#if box.items}
                    {box.items.length}
                  {:else}
                    0
                  {/if}
                </span>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </Card.Content>
    <Card.Footer>
      <div class="text-muted-foreground text-xs">
        Showing <strong>{data.room.boxes.length}</strong> boxes
      </div>
    </Card.Footer>
  {/if}
</Card.Root>

<Button
  type="button"
  on:click={openForm}
  disabled={availableQrCodes === 0}
  class="sticky bottom-2 mx-8 md:mx-[33vw] lg:mx-[40vw] flex items-center gap-2"
>
  Create a Box
  <PlusCircle class="min-w-4 max-w-4 aspect-square" />
</Button>

<CreateBoxDialog
  open={createDialogOpen}
  form={createBoxForm}
  roomDetails={{ name: data.room.name, colorCode: data.room.colorCode }}
/>
<CreateBoxSheet
  bind:open={createSheetOpen}
  form={createBoxForm}
  roomDetails={{ name: data.room.name, colorCode: data.room.colorCode }}
/>

<UpdateRoomDialog
  roomId={data.room.id}
  room={data.room}
  open={updateDialogOpen}
  form={updateRoomForm}
/>

<UpdateRoomSheet
  roomId={data.room.id}
  room={data.room}
  open={updateSheetOpen}
  form={updateRoomForm}
/>
