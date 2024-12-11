<script lang="ts">
    import { DashboardHeader, DashboardSidebar } from "@components/layout";
    let { children, data } = $props();
</script>

<div class="bg-muted/40 flex min-h-screen w-full flex-col">
    <DashboardSidebar />
    <div class="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <DashboardHeader user={data.user} />
        {@render children()}
    </div>
</div>
