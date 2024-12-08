<!-- src/routes/dashboard/components/common/UserNav.svelte -->
<script lang="ts">
    import * as DropdownMenu from "@components/ui/dropdown-menu";
    import { Button } from "@components/ui/button";
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
        <Button
            variant="outline"
            size="icon"
            class="overflow-hidden rounded-full"
            builders={[builder]}
        >
            <img
                src="/api/placeholder/36/36"
                width={36}
                height={36}
                alt="User avatar"
                class="overflow-hidden rounded-full"
            />
        </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
        <DropdownMenu.Label>My Account</DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>Profile</DropdownMenu.Item>
        <DropdownMenu.Item>Settings</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>Logout</DropdownMenu.Item>
    </DropdownMenu.Content>
</DropdownMenu.Root>
