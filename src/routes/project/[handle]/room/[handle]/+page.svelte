<script lang="ts">
    import Ellipsis from "lucide-svelte/icons/ellipsis";
    import { Badge } from "@components/ui/badge/index.js";
    import { Button } from "@components/ui/button/index.js";
    import * as Card from "@components/ui/card/index.js";
    import * as DropdownMenu from "@components/ui/dropdown-menu/index.js";
    import * as Table from "@components/ui/table/index.js";
    import QrCode from "lucide-svelte/icons/qr-code";

    const { rooms } = $props();
</script>

<Card.Root class="m-4">
    <Card.Header>
        <Card.Title>Rooms</Card.Title>
        <Card.Description>
            Manage your rooms and view their boxes.
        </Card.Description>
    </Card.Header>
    <Card.Content>
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head class="hidden w-[100px] sm:table-cell">
                        <span class="sr-only">Color Code</span>
                    </Table.Head>
                    <Table.Head>Boxes</Table.Head>
                    <Table.Head>
                        <span class="sr-only">Actions</span>
                    </Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each rooms as room}
                    <Table.Row>
                        <Table.Cell class="hidden sm:table-cell">
                            <div
                                class="aspect-square w-40"
                                style={`background-color: ${room.colorCode}`}
                            ></div>
                        </Table.Cell>
                        <Table.Cell class="font-medium">{room.name}</Table.Cell>
                        <Table.Cell class="hidden md:table-cell"
                            >{room.colorCode}</Table.Cell
                        >
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
                                    <DropdownMenu.Item>Delete</DropdownMenu.Item
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
            Showing <strong>1-10</strong> of <strong>32</strong> products
        </div>
    </Card.Footer>
</Card.Root>
