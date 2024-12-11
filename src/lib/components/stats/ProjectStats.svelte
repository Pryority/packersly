<!-- src/routes/dashboard/components/stats/ProjectStats.svelte -->
<script lang="ts">
    import * as Card from "@components/ui/card";
    import { Button } from "@components/ui/button";
    import * as Dialog from "@components/ui/dialog";
    import { CreateProjectForm } from "@components/projects";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { ProjectWithRooms } from "@types";
    import {
        type SuperValidated,
        type Infer,
        superForm,
    } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { projectSchema, type ProjectSchema } from "@routes/settings/zod";
    import type { ActionResult } from "@sveltejs/kit";
    const {
        data,
        projects,
    }: {
        data: SuperValidated<Infer<ProjectSchema>>;
        projects: ProjectWithRooms[];
    } = $props();

    let open = $state(false);
    let submitting = $state(false);

    const form = superForm(data, {
        validators: zodClient(projectSchema),
        dataType: "json",
        taintedMessage: null,
        onSubmit: ({ cancel }) => {
            submitting = true;
            return async ({ result }: { result: ActionResult }) => {
                submitting = false;
                if (result.type === "error") {
                    cancel();
                }
                // Don't handle redirect here - let SvelteKit handle it
            };
        },
        onError: () => {
            submitting = false;
        },
    });

    let activeProjectsCount = $derived(
        projects?.filter((p) => p.status === "active")?.length ?? 0,
    );

    let activeProjectsBoxCount = $derived(
        projects
            ?.filter((p) => p.status === "active")
            ?.reduce((totalBoxCount, project) => {
                const roomBoxCount =
                    project.rooms?.reduce(
                        (acc, room) => acc + (room.boxCount ?? 0),
                        0,
                    ) ?? 0;
                return totalBoxCount + roomBoxCount;
            }, 0) ?? 0,
    );

    let activeProjectsItemCount = $derived(
        projects
            ?.filter((p) => p.status === "active")
            ?.reduce((totalItemCount, project) => {
                const roomItemCount =
                    project.rooms?.reduce(
                        (acc, room) => acc + (room.itemCount ?? 0),
                        0,
                    ) ?? 0;
                return totalItemCount + roomItemCount;
            }, 0) ?? 0,
    );

    // Sync with URL state
    // $effect(() => {
    //     open = $page.url.searchParams.has("new");

    //     const formDataParam = $page.url.searchParams.get("formData");
    //     if (formDataParam) {
    //         try {
    //             const parsed = JSON.parse(decodeURIComponent(formDataParam));
    //             formData = parsed;
    //         } catch (e) {
    //             console.error("Failed to parse form data from URL");
    //         }
    //     } else {
    //         formData = form;
    //     }
    // });

    $effect(() => {
        // Close dialog and show success message if project was created
        if ($page.url.searchParams.has("success")) {
            open = false;
            // Optionally show a success toast/notification here

            // Clean up the URL
            const url = new URL($page.url);
            url.searchParams.delete("success");
            goto(url.toString(), { replaceState: true });
        } else {
            // Normal dialog open/close handling
            open = $page.url.searchParams.has("new");
        }
    });

    function openDialog() {
        const url = new URL($page.url);
        url.searchParams.set("new", "true");
        goto(url.toString(), { replaceState: true });
    }

    function closeDialog() {
        goto("/dashboard", { replaceState: true });
    }
</script>

<div
    class="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4"
>
    <Card.Root class="sm:col-span-2">
        <Card.Header class="pb-3">
            <Card.Title>Your Moving Projects</Card.Title>
            <Card.Description class="max-w-lg text-balance leading-relaxed">
                Track and manage all your moving projects in one place. Create
                QR codes for boxes and organize by room.
            </Card.Description>
        </Card.Header>
        <Card.Footer>
            <Button on:click={openDialog}>Create New Project</Button>
        </Card.Footer>
    </Card.Root>

    <Card.Root>
        <Card.Header class="pb-2">
            <Card.Description>Active Projects</Card.Description>
            <Card.Title class="text-4xl">{activeProjectsCount}</Card.Title>
        </Card.Header>
        <Card.Content>
            <div class="text-muted-foreground text-xs">
                {activeProjectsBoxCount} boxes tracked
            </div>
            <div class="text-muted-foreground text-xs">
                {activeProjectsItemCount} total items
            </div>
        </Card.Content>
    </Card.Root>

    <!-- <Card.Root>
        <Card.Header class="pb-2">
            <Card.Description>Completion Rate</Card.Description>
            <Card.Title class="text-3xl">{stats.completionRate}%</Card.Title>
        </Card.Header>
        <Card.Content>
            <div class="text-muted-foreground text-xs">Overall progress</div>
        </Card.Content>
        <Card.Footer>
            <Progress
                value={stats.completionRate}
                aria-label="Completion rate"
            />
        </Card.Footer>
    </Card.Root> -->

    <Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && closeDialog()}>
        <Dialog.Portal>
            <Dialog.Overlay
                class="bg-background/80 backdrop-blur-sm animate-in fade-in"
            />
            <Dialog.Content class="sm:max-w-[625px]">
                <Dialog.Header>
                    <Dialog.Title>Create New Project</Dialog.Title>
                    <Dialog.Description>
                        Set up your new moving project. Add rooms and assign
                        them colors for easy organization.
                    </Dialog.Description>
                </Dialog.Header>
                <CreateProjectForm {form} {submitting} />
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
</div>
