<!-- src/routes/project/[handle]/room/[handle]/box/[id]/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import Download from "lucide-svelte/icons/download";
  import { Button } from "@components/ui/button/index.js";
  import * as DropdownMenu from "@components/ui/dropdown-menu";
  import * as Card from "@components/ui/card/index.js";
  import QRCode from "qrcode";
  import EllipsisVertical from "lucide-svelte/icons/ellipsis-vertical";
  import * as Table from "@components/ui/table/index.js";
  import * as Form from "@components/ui/form";
  import type { Box } from "@db/schema/box";
  import {
    boxSchema,
    downloadQrSchema,
    itemSchema,
    type BoxSchema,
    type DownloadQrSchema,
    type ItemSchema,
  } from "@routes/settings/zod";
  import {
    type SuperValidated,
    type Infer,
    superForm,
  } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import type { ActionResult } from "@sveltejs/kit";
  import Badge from "@components/ui/badge/badge.svelte";
  import PlusCircle from "lucide-svelte/icons/plus-circle";
  import CreateItemSheet from "@components/projects/CreateItemSheet.svelte";
  import CreateItemDialog from "@components/projects/CreateItemDialog.svelte";
  import UpdateBoxDialog from "@components/projects/UpdateBoxDialog.svelte";
  import UpdateBoxSheet from "@components/projects/UpdateBoxSheet.svelte";
  import type { z } from "zod";
  import { invalidate } from "$app/navigation";

  let qrCanvas = $state<HTMLCanvasElement>();
  let createDialogOpen = $state(false);
  let createSheetOpen = $state(false);
  let updateDialogOpen = $state(false);
  let updateSheetOpen = $state(false);

  const urlChunks = $state($page.url.pathname.split("/"));
  const boxId = $derived(urlChunks[urlChunks.length - 1]);

  const { data } = $props<{
    data: {
      box: Box & {
        items: Array<
          {
            id: string;
            name: string;
            quantity: number;
          } & {
            qrCode: { id: string; url: string };
          }
        >;
      };
      qrCode?: {
        id: string;
        url: string;
        isAssigned: boolean;
        room: { colorCode: string };
      };
      downloadQrForm: SuperValidated<Infer<DownloadQrSchema>>;
      createItemForm: SuperValidated<Infer<ItemSchema>>;
      updateBoxForm: SuperValidated<Infer<BoxSchema>>;
    };
  }>();
  let { box } = $state(data);

  const downloadQrForm = superForm(data.downloadQrForm, {
    id: "download-qr",
    validators: zodClient(downloadQrSchema),
    dataType: "json",
    taintedMessage: null,
    onSubmit: ({ cancel }) => {
      return async ({ result }: { result: ActionResult }) => {
        if (result.type === "success") {
          try {
            const response = await fetch("/api/qr-code/download/svg", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                qrCode: $formData.qrCode,
                colorCode: $formData.colorCode,
              }),
            });

            if (!response.ok) {
              throw new Error("Download failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "box-qr-code.svg";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
          } catch (error) {
            console.error("Download error:", error);
          } finally {
            cancel();
          }
        } else {
          cancel();
        }
      };
    },
  });
  const { form: formData, errors, submitting: downloadingQr } = downloadQrForm;

  const createItemForm = superForm(data.createItemForm, {
    id: "create-item-form",
    validators: zodClient(itemSchema),
    resetForm: true,
    invalidateAll: true,
    onSubmit: async ({ formData, cancel }) => {
      const itemName = formData.get("name");
      console.log(itemName);
      // Check if item exists
      const response = await fetch(
        `/api/box/${boxId}/items/check?name=${itemName}`,
      );
      const exists = await response.json();

      if (
        exists &&
        !confirm(
          `An item named "${itemName}" already exists. The quantity will be added to it. Continue?`,
        )
      ) {
        cancel();
      }
    },
    onResult: ({ result, formElement }) => {
      if (result.type === "success") {
        // Close dialog/sheet
        createDialogOpen = false;
        createSheetOpen = false;

        // Reset form
        formElement.reset();
      }
    },
  });

  const boxUpdateForm = superForm(data.boxUpdateForm, {
    id: "box-update-form",
    validators: zodClient(boxSchema),
    resetForm: true,
    dataType: "json",
    invalidateAll: true,
    onResult: async ({ result, formElement }) => {
      if (result.type === "success") {
        // Close dialog/sheet
        updateDialogOpen = false;
        updateSheetOpen = false;

        // Reset form
        formElement.reset();

        // Invalidate current page to refresh data
        // await invalidate((url) => url.pathname === window.location.pathname);

        // Optional: show a toast notification
        // toast.success(result.data?.message);
      }
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

  $effect(() => {
    box = data.box;
  });

  const { form: boxUpdateFormData } = boxUpdateForm;

  $effect(() => {
    if (box?.items) {
      $boxUpdateFormData = {
        items: box.items.map((item: z.infer<typeof itemSchema>) => ({
          name: item.name,
          quantity: item.quantity,
        })),
      };
    }
  });

  $effect(() => {
    const url = data.box?.qrCode?.url || data.qrCode?.url;
    if (url && qrCanvas) {
      QRCode.toCanvas(qrCanvas, url, {
        width: 256,
        margin: 0,
        errorCorrectionLevel: "M",
      }).catch((err) => console.error("Error generating QR code:", err));
    }
  });

  $effect(() => {
    const url = data.box?.qrCode?.url || data.qrCode?.url;
    const colorCode = data.box?.room.colorCode || data.qrCode?.room.colorCode;

    if (url && (!$formData.qrCode || !$formData.colorCode)) {
      QRCode.toString(url, {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "M",
        width: 256,
      })
        .then((qrCodeSvg) => {
          formData.update(($formData) => ({
            ...$formData,
            qrCode: qrCodeSvg,
            colorCode,
          }));
        })
        .catch((err) => console.error("Error generating QR code SVG:", err));
    }
  });
</script>

<section class="flex flex-col items-center">
  <Card.Root class="m-4 md:w-2/3">
    <Card.Header class="space-y-8">
      <div class="flex flex-col gap-1">
        <div class="flex max-md:flex-col md:justify-between md:items-center">
          <div class="flex justify-between items-center">
            <Card.Title>
              {#if data.box}
                Box Contents
              {:else if data.qrCode?.isAssigned}
                Box (Assigned)
              {:else if data.qrCode}
                Box (Unassigned)
              {/if}
            </Card.Title>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  size="icon"
                  variant="outline"
                  class="h-8 w-8 md:hidden"
                >
                  <EllipsisVertical class="h-4 w-4" />
                  <span class="sr-only">Open Edit Box Menu</span>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item on:click={openUpdateForm}
                  >Edit Box</DropdownMenu.Item
                >
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  class="text-destructive focus:text-destructive"
                >
                  Delete Box
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>

          <div class="flex items-center gap-2">
            {#if data.qrCode || data.box?.qrCode}
              <Badge
                class="w-fit max-md:hidden"
                style={`background-color: ${data.box?.room.colorCode ?? data.qrCode?.room.colorCode}`}
              >
                #{data.box?.qrCode?.id ?? data.qrCode?.id}
              </Badge>
            {/if}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  size="icon"
                  variant="outline"
                  class="h-10 w-10 max-md:hidden"
                >
                  <EllipsisVertical class="h-4 w-4" />
                  <span class="sr-only">Open Edit Box Menu</span>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item on:click={openUpdateForm}
                  >Edit Box</DropdownMenu.Item
                >
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  class="text-destructive focus:text-destructive"
                >
                  Delete Box
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>
        {#if data.box?.qrCode || data.qrCode}
          <div class="mt-4 flex flex-col items-center gap-2">
            <div
              class="w-64 h-64 rounded-lg flex items-center justify-center"
              style={`border: 8px solid ${data.box?.room.colorCode ?? data.qrCode.room.colorCode}`}
            >
              {#if data.box?.qrCode?.url || data.qrCode?.url}
                <canvas bind:this={qrCanvas} class="p-3 object-contain"
                ></canvas>
              {/if}
            </div>
            <div class="flex flex-col items-center gap-2 mt-2">
              <span class="text-sm text-muted-foreground">
                {#if data.qrCode?.isAssigned}
                  Scan to view box contents
                {:else}
                  Put QR Code on a box and add items to track.
                {/if}
              </span>
              <form
                method="POST"
                action="?/download"
                use:enhance={({ cancel }) => {
                  return async () => {
                    try {
                      const response = await fetch(
                        "/api/qr-code/download/svg",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            qrCode: $formData.qrCode,
                            colorCode: $formData.colorCode,
                          }),
                        },
                      );

                      if (!response.ok) throw new Error("Download failed");

                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "box-qr-code.svg";
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      a.remove();
                    } catch (error) {
                      console.error("Download error:", error);
                    } finally {
                      cancel();
                    }
                  };
                }}
              >
                <Form.Field form={downloadQrForm} name="qrCode">
                  <Form.Control let:attrs>
                    <input
                      type="hidden"
                      bind:value={$formData.qrCode}
                      {...attrs}
                    />
                  </Form.Control>
                </Form.Field>

                <Form.Field form={downloadQrForm} name="colorCode">
                  <Form.Control let:attrs>
                    <input
                      type="hidden"
                      bind:value={$formData.colorCode}
                      {...attrs}
                    />
                  </Form.Control>
                </Form.Field>

                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  class="flex items-center gap-2"
                >
                  <Download class="h-4 w-4" />
                  {$downloadingQr ? "Downloading..." : "Download QR Code"}
                </Button>
              </form>

              <!-- Show any form errors -->
              {#if $errors.qrCode || $errors.colorCode}
                <span class="text-destructive text-sm">
                  {$errors.qrCode?.[0] || $errors.colorCode?.[0]}
                </span>
              {/if}
            </div>
          </div>
        {/if}
      </div></Card.Header
    >
    <Card.Content>
      {#if data.box?.items?.length > 0}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Item</Table.Head>
              <Table.Head class="text-end">Quantity</Table.Head>
              <!-- <Table.Head>
                            <span class="sr-only">Actions</span>
                        </Table.Head> -->
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each box.items as item}
              <Table.Row>
                <Table.Cell class="font-medium">
                  {item.name}
                </Table.Cell>
                <Table.Cell class="text-end">{item.quantity}</Table.Cell>
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
                                        <DropdownMenu.Item>Edit</DropdownMenu.Item>
                                        <DropdownMenu.Item class="text-destructive"
                                            >Remove</DropdownMenu.Item
                                        >
                                    </DropdownMenu.Content>
                                </DropdownMenu.Root>
                            </Table.Cell> -->
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {:else if data.box}
        <div class="text-center py-8 text-muted-foreground">
          No items have been added to this box yet.
        </div>
      {/if}
    </Card.Content>
    {#if data.box}
      <Card.Footer>
        <div class="text-muted-foreground text-xs">
          Showing <strong>{box.items.length}</strong> item{box.items.length ===
          1
            ? ""
            : "s"}
        </div>
      </Card.Footer>
    {/if}
  </Card.Root>

  <Button
    type="button"
    class="sticky bottom-2 mx-8 md:mx-[40vw] flex gap-2 items-center"
    on:click={openCreateForm}
  >
    <p>Add an Item</p>
    <PlusCircle size={20} />
  </Button>
</section>

<CreateItemDialog open={createDialogOpen} form={createItemForm} />
<CreateItemSheet open={createSheetOpen} form={createItemForm} />

{#if box}
  <UpdateBoxDialog
    boxId={box.id}
    {box}
    open={updateDialogOpen}
    form={boxUpdateForm}
  />
  <UpdateBoxSheet
    boxId={box.id}
    {box}
    open={updateSheetOpen}
    form={boxUpdateForm}
  />
{/if}
