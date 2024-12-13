<!-- src/routes/project/[handle]/room/[handle]/box/[id]/+page.svelte -->
<script lang="ts">
    import { enhance } from "$app/forms";
    import { goto, beforeNavigate } from "$app/navigation";
    import Ellipsis from "lucide-svelte/icons/ellipsis";
    import Download from "lucide-svelte/icons/download";
    import { Button } from "@components/ui/button/index.js";
    import * as Card from "@components/ui/card/index.js";
    import * as DropdownMenu from "@components/ui/dropdown-menu/index.js";
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

    const { data } = $props<{
        data: {
            box: Box & {
                items: Array<{
                    id: string;
                    name: string;
                    quantity: number;
                }>;
            };
            form: SuperValidated<Infer<DownloadQrSchema>>;
        };
    }>();
    const { box } = data;
    const form = superForm(data.form, {
        validators: zodClient(downloadQrSchema),
        dataType: "json",
        taintedMessage: null,
        onSubmit: ({ cancel }) => {
            submitting = true;
            return async ({ result }: { result: ActionResult }) => {
                if (result.type === "success") {
                    try {
                        const response = await fetch("/api/download-qr", {
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

    $effect(() => {
        if (box.qrCode?.code && (!$formData.qrCode || !$formData.colorCode)) {
            formData.update(($formData) => ({
                ...$formData,
                qrCode: box.qrCode.code,
                colorCode: data.box.room.colorCode,
            }));
        }
    });
</script>

<Card.Root class="m-4">
    <Card.Header>
        <Card.Title>Box Details</Card.Title>
        <Card.Description>View and manage items in this box.</Card.Description>
        {#if box.qrCode}
            <div class="mt-4 flex flex-col items-center gap-2">
                <div class="w-64 h-64">
                    {#if box.qrCode?.code}
                        {@html box.qrCode.code.replace(
                            "<svg",
                            '<svg class="h-full w-full"',
                        )}
                    {/if}
                </div>
                <div
                    class="h-8 w-5/6 rounded-sm"
                    style={`background-color: ${box.room.colorCode}`}
                ></div>
                <div class="flex flex-col items-center gap-2 mt-2">
                    <span class="text-sm text-muted-foreground">
                        Scan to view box contents
                    </span>
                    <form
                        method="POST"
                        action="?/download"
                        use:enhance={({ cancel }) => {
                            submitting = true;
                            return async () => {
                                try {
                                    const response = await fetch(
                                        "/api/download-qr",
                                        {
                                            method: "POST",
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                            },
                                            body: JSON.stringify({
                                                qrCode: $formData.qrCode,
                                                colorCode: $formData.colorCode,
                                            }),
                                        },
                                    );

                                    if (!response.ok)
                                        throw new Error("Download failed");

                                    const blob = await response.blob();
                                    const url =
                                        window.URL.createObjectURL(blob);
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
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>Name</Table.Head>
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
    </Card.Content>
    <Card.Footer>
        <div class="text-muted-foreground text-xs">
            Showing <strong>{box.items.length}</strong> item{box.items
                .length === 1
                ? ""
                : "s"}
        </div>
    </Card.Footer>
</Card.Root>
