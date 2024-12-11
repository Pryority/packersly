<!-- src/routes/dashboard/components/common/UserNav.svelte -->
<script lang="ts">
    import * as DropdownMenu from "@components/ui/dropdown-menu";
    import { Button } from "@components/ui/button";
    import { getUserInitials } from "@utils";
    import { Avatar, AvatarFallback } from "@components/ui/avatar";
    const { user } = $props();
    let initials = $state("");
    if (user) {
        initials = getUserInitials(
            user.firstName ?? "",
            user.lastName ?? "",
            user.username ?? "",
        );
    }
</script>

<!-- <Button
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
</Button> -->
<DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
        <Button
            builders={[builder]}
            variant="outline"
            size="icon"
            class="overflow-hidden rounded-full"
        >
            <Avatar
                class="border-4 w-10 h-10 border-secondary hover:border-primary
                    group ease-in-out transition-all duration-300"
            >
                <AvatarFallback
                    class="bg-background group-hover:bg-secondary group-hover:text-secondary-foreground text-primary"
                >
                    {initials}
                </AvatarFallback>
            </Avatar>
        </Button>
    </DropdownMenu.Trigger>

    <DropdownMenu.Content align="end">
        <DropdownMenu.Label>My Account</DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>Profile</DropdownMenu.Item>
        <DropdownMenu.Item>Settings</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <form method="POST" action="/logout?/logout">
            <DropdownMenu.Item
                ><Button
                    size="sm"
                    variant="ghost"
                    class="h-4 px-0"
                    type="submit">Logout</Button
                ></DropdownMenu.Item
            >
        </form>
    </DropdownMenu.Content>
</DropdownMenu.Root>
