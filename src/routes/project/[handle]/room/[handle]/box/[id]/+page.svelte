<script lang="ts">
    import Ellipsis from "lucide-svelte/icons/ellipsis";
    import { Button } from "@components/ui/button/index.js";
    import * as Card from "@components/ui/card/index.js";
    import * as DropdownMenu from "@components/ui/dropdown-menu/index.js";
    import * as Table from "@components/ui/table/index.js";
    import { page } from "$app/stores";

    const { data } = $props();
    console.log(data.rooms);
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
                    <Table.Head>Color</Table.Head>
                    <Table.Head>Name</Table.Head>
                    <Table.Head>
                        <span class="sr-only">Actions</span>
                    </Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each data.rooms as room}
                    <Table.Row>
                        <Table.Cell class="w-8">
                            <div class="flex flex-col items-center gap-1">
                                <div
                                    class="aspect-square w-8"
                                    style={`background-color: ${room.colorCode}`}
                                ></div>
                                <span class="text-[8px]">{room.colorCode}</span>
                            </div>
                        </Table.Cell>
                        <Table.Cell class="font-medium">{room.name}</Table.Cell>
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
                                    <DropdownMenu.Item
                                        ><a
                                            href={`${$page.url.pathname}/room/${room.handle}`}
                                            >View</a
                                        ></DropdownMenu.Item
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
