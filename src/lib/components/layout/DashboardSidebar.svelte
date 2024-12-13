<!-- src/routes/dashboard/components/layout/DashboardSidebar.svelte -->
<script lang="ts">
    import Package2 from "lucide-svelte/icons/package-2";
    // import House from "lucide-svelte/icons/house";
    // import Box from "lucide-svelte/icons/box";
    // import Settings from "lucide-svelte/icons/settings";
    // import * as Tooltip from "@components/ui/tooltip";
</script>

<aside
    class="bg-background fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r sm:flex"
>
    <nav class="flex flex-col items-center gap-4 px-2 sm:py-5">
        <a
            href="/"
            data-sveltekit-preload-data="hover"
            class="bg-primary text-primary-foreground group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold md:h-8 md:w-8 md:text-base"
        >
            <Package2 class="h-4 w-4 transition-all group-hover:scale-110" />
            <span class="sr-only">Packersly</span>
        </a>

        <!-- <Tooltip.Root>
            <Tooltip.Trigger asChild let:builder>
                <a
                    href="/dashboard"
                    class="text-muted-foreground hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8"
                    use:builder.action
                    {...builder}
                >
                    <House class="h-5 w-5" />
                    <span class="sr-only">Dashboard</span>
                </a>
            </Tooltip.Trigger>
            <Tooltip.Content side="right">Dashboard</Tooltip.Content>
        </Tooltip.Root> -->

        <!-- <Tooltip.Root>
            <Tooltip.Trigger asChild let:builder>
                <a
                    href="/projects"
                    class="text-muted-foreground hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8"
                    use:builder.action
                    {...builder}
                >
                    <Box class="h-5 w-5" />
                    <span class="sr-only">Projects</span>
                </a>
            </Tooltip.Trigger>
            <Tooltip.Content side="right">Projects</Tooltip.Content>
        </Tooltip.Root> -->
    </nav>

    <nav class="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <!-- <Tooltip.Root>
            <Tooltip.Trigger asChild let:builder>
                <a
                    href="/settings"
                    class="text-muted-foreground hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8"
                    use:builder.action
                    {...builder}
                >
                    <Settings class="h-5 w-5" />
                    <span class="sr-only">Settings</span>
                </a>
            </Tooltip.Trigger>
            <Tooltip.Content side="right">Settings</Tooltip.Content>
        </Tooltip.Root>
         -->
    </nav>
</aside>
