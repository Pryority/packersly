<!-- src/routes/dashboard/components/projects/ProjectFilters.svelte -->
<script lang="ts">
    import { Button } from "@components/ui/button";
    import * as DropdownMenu from "@components/ui/dropdown-menu";
    import ListFilter from "lucide-svelte/icons/list-filter";
    import FileIcon from "lucide-svelte/icons/file";
</script>

<div class="flex items-center gap-2">
    <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
            <Button
                variant="outline"
                size="sm"
                class="h-7 gap-1 text-sm"
                builders={[builder]}
            >
                <ListFilter class="h-3.5 w-3.5" />
                <span class="sr-only sm:not-sr-only">Filter</span>
            </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
            <DropdownMenu.Label>Filter by Status</DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.CheckboxItem checked>
                Active
            </DropdownMenu.CheckboxItem>
            <DropdownMenu.CheckboxItem>Completed</DropdownMenu.CheckboxItem>
            <DropdownMenu.CheckboxItem>Draft</DropdownMenu.CheckboxItem>
        </DropdownMenu.Content>
    </DropdownMenu.Root>

    <Button size="sm" variant="outline" class="h-7 gap-1 text-sm">
        <FileIcon class="h-3.5 w-3.5" />
        <span class="sr-only sm:not-sr-only">Export</span>
    </Button>
</div>
