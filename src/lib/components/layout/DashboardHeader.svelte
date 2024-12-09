<!-- src/routes/dashboard/components/layout/DashboardHeader.svelte -->
<script lang="ts">
    import { PanelLeft, Search } from "lucide-svelte";
    import { Button } from "@components/ui/button";
    import { Input } from "@components/ui/input";
    import * as Sheet from "@components/ui/sheet";
    import * as Breadcrumb from "@components/ui/breadcrumb";
    import { MobileNav } from "@components/layout";
    import { UserNav } from "@components/common";

    const { user } = $props();
</script>

<header
    class="bg-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6"
>
    <Sheet.Root>
        <Sheet.Trigger asChild let:builder>
            <Button
                builders={[builder]}
                size="icon"
                variant="outline"
                class="sm:hidden"
            >
                <PanelLeft class="h-5 w-5" />
                <span class="sr-only">Toggle Menu</span>
            </Button>
        </Sheet.Trigger>
        <MobileNav />
    </Sheet.Root>

    <Breadcrumb.Root class="hidden md:flex">
        <Breadcrumb.List>
            <Breadcrumb.Item>
                <Breadcrumb.Link href="/dashboard">Dashboard</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
                <Breadcrumb.Page>Projects</Breadcrumb.Page>
            </Breadcrumb.Item>
        </Breadcrumb.List>
    </Breadcrumb.Root>

    <div class="relative ml-auto flex-1 md:grow-0">
        <Search
            class="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4"
        />
        <Input
            type="search"
            placeholder="Search projects..."
            class="bg-background w-full rounded-lg pl-8 md:w-[200px] lg:w-[336px]"
        />
    </div>

    <UserNav {user} />
</header>
