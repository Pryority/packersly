<!-- src/routes/dashboard/components/stats/ProjectStats.svelte -->
<script lang="ts">
    import * as Card from "@components/ui/card";
    import { Button } from "@components/ui/button";
    import {
        type SuperValidated,
        type Infer,
        superForm,
    } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { projectSchema, type ProjectSchema } from "@routes/settings/zod";
    import type { ActionResult } from "@sveltejs/kit";
    import type { ProjectData } from "@types";
    import { getProjectStats } from "@utils";
    import CreateProjectDialog from "@components/projects/CreateProjectDialog.svelte";
    import CreateProjectSheet from "@components/projects/CreateProjectSheet.svelte";

    const {
        data,
        projects,
    }: {
        data: SuperValidated<Infer<ProjectSchema>>;
        projects: ProjectData[];
    } = $props();

    let dialogOpen = $state(false);
    let sheetOpen = $state(false);
    let submitting = $state(false);
    // let errorDialogOpen = $state(false);

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
        onResult: () => {
            submitting = false;
            dialogOpen = false;
            sheetOpen = false;
        },
    });

    let activeStats = $derived(getProjectStats(projects, "active"));
    let draftStats = $derived(getProjectStats(projects, "draft"));
    let completedStats = $derived(getProjectStats(projects, "completed"));

    // function openForm() {
    //     const url = new URL($page.url);
    //     url.searchParams.set("new", "true");
    //     goto(url.toString(), { replaceState: true });
    // }
    //

    function openForm() {
        dialogOpen = true;
    }

    // function closeForm() {
    //     goto("/dashboard", { replaceState: true });
    // }

    // $effect(() => {
    //     // Close dialog and show success message if project was created
    //     if ($page.url.searchParams.has("success")) {
    //         dialogOpen = false;
    //         sheetOpen = false;
    //         // Optionally show a success toast/notification here

    //         // Clean up the URL
    //         const url = new URL($page.url);
    //         url.searchParams.delete("success");
    //         goto(url.toString(), { replaceState: true });
    //     } else {
    //         // Normal dialog open/close handling
    //         const isMobile = window.innerWidth < 768; // matches your md: breakpoint
    //         dialogOpen = !isMobile && $page.url.searchParams.has("new");
    //         sheetOpen = isMobile && $page.url.searchParams.has("new");
    //     }
    // });
</script>

<div
    class="grid gap-4 min-w-0 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-5"
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
            <Button on:click={openForm}>Create New Project</Button>
        </Card.Footer>
    </Card.Root>

    <Card.Root>
        <Card.Header class="pb-2">
            <Card.Description>Active Projects</Card.Description>
            <Card.Title class="text-4xl">{activeStats.count}</Card.Title>
        </Card.Header>
        <Card.Content>
            <div class="text-muted-foreground text-xs">
                {activeStats.boxCount} boxes
            </div>
            <div class="text-muted-foreground text-xs">
                {activeStats.itemCount} items
            </div>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header class="pb-2">
            <Card.Description>Draft Projects</Card.Description>
            <Card.Title class="text-4xl">{draftStats.count}</Card.Title>
        </Card.Header>
        <Card.Content>
            <div class="text-muted-foreground text-xs">
                {draftStats.boxCount} boxes
            </div>
            <div class="text-muted-foreground text-xs">
                {draftStats.itemCount} items
            </div>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header class="pb-2">
            <Card.Description>Completed Projects</Card.Description>
            <Card.Title class="text-4xl">{completedStats.count}</Card.Title>
        </Card.Header>
        <Card.Content>
            <div class="text-muted-foreground text-xs">
                {completedStats.boxCount} boxes
            </div>
            <div class="text-muted-foreground text-xs">
                {completedStats.itemCount} items
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
</div>

<CreateProjectDialog bind:open={dialogOpen} {form} {submitting} />
<CreateProjectSheet bind:open={sheetOpen} {form} {submitting} />
