<!-- src/lib/components/projects/CreateProjectSheet.svelte -->
<script lang="ts">
    import * as Sheet from "@components/ui/sheet";
    import { CreateProjectForm } from "@components/projects";
    import type { SuperForm } from "sveltekit-superforms";
    import type { Infer } from "sveltekit-superforms";
    import type { ProjectSchema } from "@routes/settings/zod";

    let {
        open = $bindable(false),
        form,
        submitting,
    }: {
        open: boolean;
        form: SuperForm<Infer<ProjectSchema>>;
        submitting: boolean;
    } = $props();
</script>

{#if open}
    <Sheet.Root bind:open>
        <Sheet.Content
            side="bottom"
            class="md:hidden max-h-[90vh] overflow-y-auto"
        >
            <Sheet.Header class="mb-4">
                <Sheet.Title>Create New Project</Sheet.Title>
                <Sheet.Description class="text-xs">
                    Set up your new moving project. Add rooms and assign them
                    colors for easy organization.
                </Sheet.Description>
            </Sheet.Header>
            <CreateProjectForm {form} {submitting} />
            <Sheet.Close class="absolute right-4 top-4" />
        </Sheet.Content>
    </Sheet.Root>
{/if}
