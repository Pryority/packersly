<!-- src/routes/project/[handle]/room/[handle]/+page.svelte -->
<script lang="ts">
  import * as Dialog from "@components/ui/dialog";
  import * as Sheet from "@components/ui/sheet";
  import { Button } from "@components/ui/button/index.js";
  import * as Card from "@components/ui/card/index.js";
  import * as Table from "@components/ui/table/index.js";
  import { page } from "$app/stores";
  import CreateBoxForm from "@components/projects/CreateBoxForm.svelte";
  import type {
    BoxSchema,
    DownloadQrSchema,
    GenerateQrSchema,
  } from "@routes/settings/zod";
  import {
    type SuperValidated,
    type Infer,
    superForm,
  } from "sveltekit-superforms";
  import { goto } from "$app/navigation";
  import { zodClient } from "sveltekit-superforms/adapters";
  import type { ActionResult } from "@sveltejs/kit";
  import {
    boxSchema,
    downloadQrSchema,
    generateQrSchema,
  } from "@routes/settings/zod";
  import { cn, downloadBlob } from "@utils";
  import QRCode from "qrcode";
  import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
  import Download from "lucide-svelte/icons/download";
  import PlusCircle from "lucide-svelte/icons/plus-circle";
  import type { Room, Box } from "@db/schema";

  const {
    data,
  }: {
    data: {
      room: Room & { boxes: Box[] };
      availableQrCodes: number;
      createBoxForm: SuperValidated<Infer<BoxSchema>>;
      generateQrForm: SuperValidated<Infer<GenerateQrSchema>>;
      downloadQrForm: SuperValidated<Infer<DownloadQrSchema>>;
    };
  } = $props();

  let dialogOpen = $state(false);
  let sheetOpen = $state(false);
  let qrCanvases = $state<Record<string, HTMLCanvasElement>>({});
  const availableQrCodes = $derived(data.availableQrCodes);

  const createBoxForm = superForm(data.createBoxForm, {
    id: "create-box-form",
    validators: zodClient(boxSchema),
    dataType: "json",
    taintedMessage: null,
    timeoutMs: 8000, // Add timeout
    onSubmit: ({ cancel }) => {
      return async ({ result }: { result: ActionResult }) => {
        try {
          if (result.type === "error" || result.type === "failure") {
            cancel();
          } else {
            dialogOpen = false;
            sheetOpen = false;
          }
        } catch (error) {
          cancel();
        }
      };
    },
  });

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

  function openForm() {
    const isMobile = window.innerWidth < 768;
    dialogOpen = !isMobile;
    sheetOpen = isMobile;
  }

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
  <Card.Header>
    <Card.Title>QR Code Management</Card.Title>
    <Card.Description
      >Generate and print QR codes for your boxes</Card.Description
    >
  </Card.Header>

  <Card.Content>
    <div class="flex flex-col gap-4">
      <div
        class="bg-secondary p-4 rounded-lg flex flex-col items-center justify-between gap-4"
      >
        <div class="flex max-md:flex-col w-full md:justify-between">
          <div class="max-md:mb-2 max-md:text-center">
            <p class="text-sm text-muted-foreground">Available QR Codes</p>
            <p class="text-2xl font-bold">{availableQrCodes || 0}</p>
          </div>

          <form
            method="POST"
            action="?/generate-qr"
            use:enhanceGenerateQr
            class="flex max-md:flex-col gap-2 max-md:w-full"
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
                  count: 50,
                };
              }}
              disabled={$generatingQr}
              type="submit"
            >
              Generate 50
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
            class="w-fit"
            use:enhanceDownloadQr
          >
            <input type="hidden" name="roomId" value={data.room.id} />
            <Button
              type="submit"
              disabled={$downloadingQr || availableQrCodes === 0}
              class="relative"
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
        {#if availableQrCodes === 0}
          <Alert variant="destructive">
            <AlertTitle>No QR Codes Available</AlertTitle>
            <AlertDescription>
              You must generate QR codes before creating a box to track or store
              items.
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
  </Card.Content>
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
              <Table.Cell>
                <span class="max-md:text-end">
                  {#if box.items}
                    {box.items.length}
                  {:else}
                    0
                  {/if}
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
        Showing <strong>{data.room.boxes.length}</strong> boxes
      </div>
    </Card.Footer>
  {/if}
</Card.Root>

<Button
  type="button"
  on:click={openForm}
  disabled={availableQrCodes === 0}
  class="sticky bottom-2 mx-8 md:mx-[40vw] flex items-center gap-2"
>
  Create a Box
  <PlusCircle size={16} />
</Button>

<Dialog.Root bind:open={dialogOpen} onOpenChange={(isOpen) => !isOpen}>
  <Dialog.Portal class="hidden md:block">
    <Dialog.Overlay
      class="bg-background/80 backdrop-blur-sm animate-in fade-in"
    />
    <Dialog.Content class="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
      <Dialog.Header class="top-0 z-10 pb-4 max-w-fit">
        <Dialog.Title>Add a Box to Room</Dialog.Title>
        <Dialog.Description class="flex flex-col gap-4">
          Update your room. Add boxes with items for easy organization.
          <span class="flex items-center gap-2">
            <strong class="max-md:text-xs">Room Name:</strong>
            <span class="mad-md:text-xs">
              {data.room.name}
            </span>
          </span>
          <span class="flex items-center gap-2">
            <strong class="max-md:text-xs">Room Color Code:</strong>
            <span
              class="h-4 w-4 rounded-sm"
              style={`background-color: ${data.room.colorCode}`}
            ></span>
            <span class="mad-md:text-xs">
              {data.room.colorCode}
            </span>
          </span>
        </Dialog.Description>
      </Dialog.Header>
      <div>
        <CreateBoxForm form={createBoxForm} />
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<Sheet.Root bind:open={sheetOpen} onOpenChange={(isOpen) => !isOpen}>
  <Sheet.Content side="bottom" class="md:hidden max-h-[80vh] overflow-y-auto">
    <Sheet.Header class="mb-4">
      <Sheet.Title>Add a Box to Room</Sheet.Title>
      <Sheet.Description class="flex flex-col gap-4 text-xs">
        Update your room. Add boxes with items for easy organization.<br />
        <span class="flex justify-between">
          <span class="flex items-center gap-2">
            <strong class="max-md:text-xs md:hidden">Room:</strong>
            <span class="mad-md:text-xs">
              {data.room.name}
            </span>
          </span>
          <span class="flex items-center gap-2">
            <strong class="max-md:text-xs">Color:</strong>
            <span
              class="h-4 w-4 rounded-sm"
              style={`background-color: ${data.room.colorCode}`}
            ></span>
            <span class="mad-md:text-xs">
              {data.room.colorCode}
            </span>
          </span>
        </span>
      </Sheet.Description>
    </Sheet.Header>
    <CreateBoxForm form={createBoxForm} />
  </Sheet.Content>
</Sheet.Root>
