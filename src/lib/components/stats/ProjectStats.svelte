<!-- src/routes/dashboard/components/stats/ProjectStats.svelte -->
<script lang="ts">
    import * as Card from "@components/ui/card";
    import { Button } from "@components/ui/button";
    import { Progress } from "@components/ui/progress";
    import * as Dialog from "@components/ui/dialog";
    import { CreateProjectForm } from "@components/projects";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    // These would come from your data store
    const stats = {
        activeProjects: 12,
        totalBoxes: 156,
        completionRate: 85,
    };
    let showDialog = $state(false);
    let formData = $state({
        name: "",
        fromAddress: "",
        toAddress: "",
        rooms: [{ name: "", colorCode: "#000000" }],
    });

    // Get the dialog state and form data from URL
    $effect(() => {
        showDialog = $page.url.searchParams.has("new");
        // Parse form data from URL if present
        const formDataParam = $page.url.searchParams.get("formData");
        if (formDataParam) {
            try {
                formData = JSON.parse(decodeURIComponent(formDataParam));
            } catch (e) {
                console.error("Failed to parse form data from URL");
            }
        }
    });

    function openDialog() {
        const searchParams = new URLSearchParams($page.url.searchParams);
        searchParams.set("new", "true");
        searchParams.set(
            "formData",
            encodeURIComponent(JSON.stringify(formData)),
        );
        goto(`?${searchParams.toString()}`, { keepFocus: true });
    }

    function closeDialog() {
        goto("/dashboard", { keepFocus: true });
    }

    function updateFormData(newData: typeof formData) {
        formData = newData;
        const searchParams = new URLSearchParams($page.url.searchParams);
        searchParams.set(
            "formData",
            encodeURIComponent(JSON.stringify(newData)),
        );
        goto(`?${searchParams.toString()}`, {
            keepFocus: true,
            noScroll: true,
        });
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
            <Card.Title class="text-4xl">{stats.activeProjects}</Card.Title>
        </Card.Header>
        <Card.Content>
            <div class="text-muted-foreground text-xs">
                {stats.totalBoxes} boxes tracked
            </div>
        </Card.Content>
    </Card.Root>

    <Card.Root>
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
    </Card.Root>

    <Dialog.Root
        open={showDialog}
        onOpenChange={(open: boolean) => !open && closeDialog()}
    >
        <Dialog.Content class="sm:max-w-[625px]">
            <Dialog.Header>
                <Dialog.Title>Create New Project</Dialog.Title>
                <Dialog.Description>
                    Set up your new moving project. Add rooms and assign them
                    colors for easy organization.
                </Dialog.Description>
            </Dialog.Header>

            <CreateProjectForm
                onSuccess={closeDialog}
                initialData={formData}
                onFormChange={updateFormData}
            />
        </Dialog.Content>
    </Dialog.Root>
</div>
