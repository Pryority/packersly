<!-- src/lib/components/projects/UpdateProjectSheet.svelte -->
<script lang="ts">
    import * as Sheet from "@components/ui/sheet";
    import UpdateProjectForm from "@components/projects/UpdateProjectForm.svelte";
    import type { SuperForm } from "sveltekit-superforms";
    import type { Infer } from "sveltekit-superforms";
    import type { ProjectSchema } from "@routes/settings/zod";
    let {
        projectId,
        open = $bindable(false),
        form,
        submitting,
    }: {
        projectId: string;
        open: boolean;
        form: SuperForm<Infer<ProjectSchema>>;
        submitting: boolean;
    } = $props();
</script>

<Sheet.Root bind:open onOpenChange={(isOpen) => !isOpen}>
    <Sheet.Content
        side="bottom"
        class="md:hidden max-h-[90vh]  overflow-y-auto"
    >
        <Sheet.Header class="mb-4">
            <Sheet.Title>Update Project</Sheet.Title>
            <Sheet.Description class="text-xs">
                Update information about this moving project.
            </Sheet.Description>
        </Sheet.Header>
        <UpdateProjectForm {form} {submitting} {projectId} />
    </Sheet.Content>
</Sheet.Root>
