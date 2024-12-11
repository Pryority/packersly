<!-- src/routes/dashboard/components/layout/MobileNav.svelte -->
<script lang="ts">
    import * as Sheet from "@components/ui/sheet";
    import Package2 from "lucide-svelte/icons/package-2";
    import House from "lucide-svelte/icons/house";
    import Settings from "lucide-svelte/icons/settings";
</script>

<Sheet.Content side="left" class="w-[80vw] sm:max-w-xs">
    <nav class="grid gap-6 text-lg font-medium">
        <a
            href="/dashboard"
            class="bg-primary text-primary-foreground group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold"
        >
            <Package2 class="h-5 w-5 transition-all group-hover:scale-110" />
            <span class="sr-only">Packersly</span>
        </a>

        <a
            href="/dashboard"
            class="text-muted-foreground hover:text-foreground flex items-center gap-4 px-2.5"
        >
            <House class="h-5 w-5" />
            Dashboard
        </a>

        <!-- <a
            href="/projects"
            class="text-foreground flex items-center gap-4 px-2.5"
        >
            <Box class="h-5 w-5" />
            Projects
        </a> -->

        <a
            href="/settings"
            class="text-muted-foreground hover:text-foreground flex items-center gap-4 px-2.5"
        >
            <Settings class="h-5 w-5" />
            Settings
        </a>
    </nav>
</Sheet.Content>
