<script lang="ts">
    const { imageUrl, children, imagePosition = "right" } = $props();
</script>

<div class="min-h-screen flex">
    {#if imagePosition === "left"}
        <!-- Left side - Image -->
        <div class="hidden lg:block relative flex-1">
            <img
                class="absolute inset-0 h-full w-full object-cover"
                src={imageUrl}
                alt="Authentication background"
            />
        </div>
    {/if}

    <!-- Form -->
    <div
        class="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24"
    >
        <div class="mx-auto w-full max-w-sm lg:w-96">
            {@render children()}
        </div>
    </div>

    {#if imagePosition === "right"}
        <!-- Right side - Image -->
        <div class="hidden lg:block relative flex-1">
            <img
                class="absolute inset-0 h-full w-full object-cover"
                src={imageUrl}
                alt="Authentication background"
            />
        </div>
    {/if}
</div>
