<!-- src/routes/project/[handle]/room/[handle]/+page.svelte -->
<script lang="ts">
  import * as Dialog from "@components/ui/dialog";
  import * as Sheet from "@components/ui/sheet";
  import { Button } from "@components/ui/button/index.js";
  import * as Card from "@components/ui/card/index.js";
  import * as Table from "@components/ui/table/index.js";
  import { page } from "$app/stores";
  import CreateBoxForm from "@components/projects/CreateBoxForm.svelte";
  import type { BoxSchema } from "@routes/settings/zod/boxSchema.js";
  import {
    type SuperValidated,
    type Infer,
    superForm,
  } from "sveltekit-superforms";
  import { goto, invalidateAll } from "$app/navigation";
  import { zodClient } from "sveltekit-superforms/adapters";
  import type { ActionResult } from "@sveltejs/kit";
  import { boxSchema } from "@routes/settings/zod";
  import { cn } from "@utils";
  import QRCode from "qrcode";
  import type { BoxWithRelations } from "@types";
  import { Alert, AlertDescription } from "@components/ui/alert";

  const {
    data,
  }: {
    data: {
      room: any;
      availableQrCodes: number;
      form: SuperValidated<Infer<BoxSchema>>;
    };
  } = $props();

  const form = superForm(data.form, {
    id: "create-box-form",
    validators: zodClient(boxSchema),
    dataType: "json",
    taintedMessage: null,
    timeoutMs: 8000, // Add timeout
    onSubmit: ({ cancel }) => {
      submitting = true;
      return async ({ result }: { result: ActionResult }) => {
        try {
          if (result.type === "error" || result.type === "failure") {
            submitting = false;
            cancel();
          } else {
            dialogOpen = false;
            sheetOpen = false;
            submitting = false;
          }
        } catch (error) {
          submitting = false;
          cancel();
        }
      };
    },
    onError: () => {
      submitting = false;
    },
  });

  let dialogOpen = $state(false);
  let sheetOpen = $state(false);
  let submitting = $state(false);
  let qrCanvases = $state<Record<string, HTMLCanvasElement>>({});
  let generatingQr = $state(false);

  function openForm() {
    const isMobile = window.innerWidth < 768;
    dialogOpen = !isMobile;
    sheetOpen = isMobile;
  }

  async function generateQrCodes(amount: number) {
    generatingQr = true;
    try {
      const response = await fetch("/api/qr-code/generate", {
        method: "POST",
        body: JSON.stringify({
          roomId: data.room.id,
          count: amount,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate QR codes");

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.room.name}-qr-codes.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      await invalidateAll();
    } catch (error) {
      console.error("Failed to generate QR codes:", error);
    } finally {
      generatingQr = false;
    }
  }

  $effect(() => {
    if (data.room.boxes) {
      data.room.boxes.forEach((box: BoxWithRelations) => {
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
        class="bg-secondary p-4 rounded-lg flex items-center justify-between"
      >
        <div>
          <p class="text-sm text-muted-foreground">Available QR Codes</p>
          <p class="text-2xl font-bold">{data.availableQrCodes || 0}</p>
        </div>

        <div class="flex gap-2">
          <Button
            variant="outline"
            on:click={() => generateQrCodes(25)}
            disabled={generatingQr}
          >
            Generate 25
          </Button>
          <Button
            variant="outline"
            on:click={() => generateQrCodes(50)}
            disabled={generatingQr}
          >
            Generate 50
          </Button>
          <Button on:click={() => generateQrCodes(100)} disabled={generatingQr}>
            Generate 100
          </Button>
        </div>
      </div>

      {#if data.availableQrCodes < 10}
        <Alert>
          <AlertDescription>
            Running low on available QR codes. Generate more to ensure you have
            enough for your boxes.
          </AlertDescription>
        </Alert>
      {/if}
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

            <Table.Head>Items</Table.Head>
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
              <!-- <Table.Cell>
                                <span class="text-center md:text-start">
                                    {data.room.boxes.length}
                                </span>
                            </Table.Cell> -->

              <Table.Cell>
                <span class="text-center md:text-start">
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
  class="sticky bottom-2 mx-8 md:mx-[40vw]"
>
  Create a Box
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
        <CreateBoxForm {form} bind:submitting />
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
    <CreateBoxForm {form} bind:submitting />
  </Sheet.Content>
</Sheet.Root>
