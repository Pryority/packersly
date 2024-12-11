<!-- src/routes/project/[handle]/room/[handle]/box/[id]/+page.svelte -->
<script lang="ts">
    import Ellipsis from "lucide-svelte/icons/ellipsis";
    import { Button } from "@components/ui/button/index.js";
    import * as Card from "@components/ui/card/index.js";
    import * as DropdownMenu from "@components/ui/dropdown-menu/index.js";
    import * as Table from "@components/ui/table/index.js";
    import { page } from "$app/stores";
    import type { Box } from "@db/schema/box";

    const { data } = $props<{
        data: {
            box: Box & {
                items: Array<{
                    id: string;
                    name: string;
                    quantity: number;
                }>;
            };
        };
    }>();

    const { box } = data;
</script>

<Card.Root class="m-4">
    <Card.Header>
        <Card.Title>Box Details</Card.Title>
        <Card.Description>
            View and manage items in this box.
            {#if box.qrCode}
                <div class="mt-4 flex flex-col items-center gap-2">
                    <div class="w-64 h-64">
                        {@html box.qrCode.replace(
                            "<svg",
                            '<svg class="h-full w-full"',
                        )}
                    </div>
                    <div class="text-sm text-muted-foreground">
                        Scan to view box contents
                    </div>
                </div>
            {/if}
        </Card.Description>
    </Card.Header>
    <Card.Content>
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>Name</Table.Head>
                    <Table.Head>Quantity</Table.Head>
                    <Table.Head>
                        <span class="sr-only">Actions</span>
                    </Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each box.items as item}
                    <Table.Row>
                        <Table.Cell class="font-medium">
                            {item.name}
                        </Table.Cell>
                        <Table.Cell>{item.quantity}</Table.Cell>
                        <Table.Cell>
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
                        </Table.Cell>
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
