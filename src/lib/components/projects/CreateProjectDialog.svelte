<!-- src/lib/components/projects/CreateProjectDialog.svelte -->
<script lang="ts">
    import * as Dialog from "@components/ui/dialog";
    import { CreateProjectForm } from "@components/projects";
    import type { SuperForm } from "sveltekit-superforms";
    import type { Infer } from "sveltekit-superforms";
    import type { ProjectSchema } from "@routes/settings/zod";

    export let open = false;
    export let form: SuperForm<Infer<ProjectSchema>>;
    export let submitting: boolean;
</script>

{#if open}
    <Dialog.Root bind:open>
        <Dialog.Portal>
            <Dialog.Overlay
                class="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"
            />
            <Dialog.Content
                class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] sm:max-w-[625px] max-h-[90vh] overflow-y-auto w-full md:w-full p-6 bg-background shadow-lg"
            >
                <Dialog.Header class="top-0 z-10 pb-4 w-fit">
                    <Dialog.Title>Create New Project</Dialog.Title>
                    <Dialog.Description>
                        Set up your new moving project. Add rooms and assign
                        them colors for easy organization.
                    </Dialog.Description>
                </Dialog.Header>
                <CreateProjectForm {form} {submitting} />
                <Dialog.Close class="absolute right-4 top-4" />
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
{/if}
