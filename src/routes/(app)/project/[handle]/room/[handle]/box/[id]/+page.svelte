<!-- src/routes/project/[handle]/room/[handle]/box/[id]/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Download from "lucide-svelte/icons/download";
  import { Button } from "@components/ui/button/index.js";
  import * as Card from "@components/ui/card/index.js";
  import QRCode from "qrcode";
  import * as Table from "@components/ui/table/index.js";
  import * as Form from "@components/ui/form";
  import type { Box } from "@db/schema/box";
  import {
    downloadQrSchema,
    type DownloadQrSchema,
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
      form: SuperValidated<Infer<DownloadQrSchema>>;
    };
  }>();
  const { box } = data;
  const form = superForm(data.form, {
    id: "download-qr",
    validators: zodClient(downloadQrSchema),
    dataType: "json",
    taintedMessage: null,
    onSubmit: ({ cancel }) => {
      submitting = true;
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
            submitting = false;
            cancel();
          }
        } else {
          submitting = false;
          cancel();
        }
      };
    },
    onError: () => {
      submitting = false;
    },
  });

  const { form: formData, errors } = form;
  let submitting = $state(false);
  let qrCanvas = $state<HTMLCanvasElement>();

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
        <div class="flex max-md:flex-col md:justify-between">
          <Card.Title>
            {#if data.box}
              Box Contents
            {:else if data.qrCode?.isAssigned}
              Box (Assigned)
            {:else if data.qrCode}
              Box (Unassigned)
            {/if}
          </Card.Title>

          {#if data.qrCode || data.box?.qrCode}
            <Badge
              class="w-fit max-md:hidden max-md:mt-1"
              style={`background-color: ${data.box?.room.colorCode ?? data.qrCode?.room.colorCode}`}
            >
              #{data.box?.qrCode?.id ?? data.qrCode?.id}
            </Badge>
          {/if}
        </div>

        <Card.Description>
          {#if data.box}
            View and manage items stored in this box.
          {:else if data.qrCode?.isAssigned}
            This QR code has been assigned to a box but items haven't been added
            yet.
          {:else if data.qrCode}
            This QR code is ready to be assigned and used. Download the code if
            you haven't already and stick it on the box you want, add items to
            track its contents.
          {/if}
        </Card.Description>

        {#if data.qrCode || data.box?.qrCode}
          <Badge
            class="w-fit md:hidden max-md:mt-1"
            style={`background-color: ${data.box?.room.colorCode ?? data.qrCode?.room.colorCode}`}
          >
            #{data.box?.qrCode?.id ?? data.qrCode?.id}
          </Badge>
        {/if}
      </div>
      {#if data.box?.qrCode || data.qrCode}
        <div class="mt-4 flex flex-col items-center gap-2">
          <div
            class="w-64 h-64 rounded-lg flex items-center justify-center"
            style={`border: 8px solid ${data.box?.room.colorCode ?? data.qrCode.room.colorCode}`}
          >
            {#if data.box?.qrCode?.url || data.qrCode?.url}
              <canvas bind:this={qrCanvas} class="p-3 object-contain"></canvas>
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
                submitting = true;
                return async () => {
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
                    submitting = false;
                    cancel();
                  }
                };
              }}
            >
              <Form.Field {form} name="qrCode">
                <Form.Control let:attrs>
                  <input
                    type="hidden"
                    bind:value={$formData.qrCode}
                    {...attrs}
                  />
                </Form.Control>
              </Form.Field>

              <Form.Field {form} name="colorCode">
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
                {submitting ? "Downloading..." : "Download QR Code"}
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
    </Card.Header>
    <Card.Content>
      {#if data.box?.items?.length > 0}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Item</Table.Head>
              <Table.Head>Quantity</Table.Head>
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
                <Table.Cell>{item.quantity}</Table.Cell>
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
  >
    <p>Add an Item</p>
    <PlusCircle size={20} />
  </Button>
</section>
