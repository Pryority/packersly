<!-- src/routes/dashboard/components/stats/ProjectStats.svelte -->
<script lang="ts">
    import * as Card from "@components/ui/card";
    import { Button } from "@components/ui/button";
    import { Progress } from "@components/ui/progress";
    import { Package2 } from "lucide-svelte";

    // These would come from your data store
    const stats = {
        activeProjects: 12,
        totalBoxes: 156,
        completionRate: 85,
    };
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
            <Button>Create New Project</Button>
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
</div>
