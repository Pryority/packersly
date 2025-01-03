<!-- src/routes/dashboard/components/layout/DashboardHeader.svelte -->
<script lang="ts">
  import PanelLeft from "lucide-svelte/icons/panel-left";
  import { Button } from "@components/ui/button";
  import * as Sheet from "@components/ui/sheet";
  import * as Breadcrumb from "@components/ui/breadcrumb";
  import { MobileNav } from "@components/layout";
  import { UserNav } from "@components/common";
  import { page } from "$app/stores";

  const { user } = $props();

  // Get current URL and parse it
  let path = $state($page.url.pathname);
  let open = $state(false);
  let lastScrollY = $state(0);
  let isVisible = $state(true);

  // Parse URL segments
  function getBreadcrumbs(path: string) {
    const segments = path.split("/").filter(Boolean);
    const breadcrumbs = [];

    // Always add dashboard as first item
    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboard",
    });

    if (segments.includes("project")) {
      const projectIndex = segments.indexOf("project");
      const projectSlug = segments[projectIndex + 1];
      breadcrumbs.push({
        label: projectSlug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        href: `/project/${projectSlug}`,
      });

      if (segments.includes("room")) {
        const roomIndex = segments.indexOf("room");
        const roomSlug = segments[roomIndex + 1];
        breadcrumbs.push({
          label: roomSlug
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          href: `/project/${projectSlug}/room/${roomSlug}`,
        });

        if (segments.includes("box")) {
          const boxIndex = segments.indexOf("box");
          const boxId = segments[boxIndex + 1];
          breadcrumbs.push({
            label: `Box ${boxId}`,
            href: `/project/${projectSlug}/room/${roomSlug}/box/`,
          });
        }
      }
    }

    return breadcrumbs;
  }

  $effect(() => {
    path = $page.url.pathname;
    open = false;
  });

  $effect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show navbar at the top of the page
      if (currentScrollY < 50) {
        isVisible = true;
      } else {
        // Compare current scroll position with last scroll position
        isVisible = currentScrollY < lastScrollY;
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup function
    return () => window.removeEventListener("scroll", handleScroll);
  });

  const breadcrumbs = $derived(getBreadcrumbs(path));
</script>

<header
  class="bg-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 justify-between transform transition-transform duration-300 ease-in-out"
  style:transform={isVisible ? "translateY(0)" : "translateY(-100%)"}
>
  <Sheet.Root bind:open>
    <Sheet.Trigger asChild let:builder>
      <Button
        builders={[builder]}
        size="icon"
        variant="outline"
        class="sm:hidden"
      >
        <PanelLeft class="h-5 w-5" />
        <span class="sr-only">Toggle Menu</span>
      </Button>
    </Sheet.Trigger>
    <MobileNav />
  </Sheet.Root>
  <Breadcrumb.Root class="hidden md:flex">
    <Breadcrumb.List>
      {#each breadcrumbs as crumb, i}
        <Breadcrumb.Item>
          {#if i === breadcrumbs.length - 1}
            <Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
          {:else}
            <Breadcrumb.Link
              href={crumb.href}
              data-sveltekit-preload-data="hover">{crumb.label}</Breadcrumb.Link
            >
          {/if}
        </Breadcrumb.Item>
        {#if i < breadcrumbs.length - 1}
          <Breadcrumb.Separator />
        {/if}
      {/each}
    </Breadcrumb.List>
  </Breadcrumb.Root>
  <UserNav {user} />
</header>
{#if breadcrumbs.length > 1}
  <div class="md:hidden px-4 py-2 border-b bg-background">
    <Breadcrumb.Root>
      <Breadcrumb.List class="flex flex-wrap items-center gap-1 text-sm">
        {#each breadcrumbs as crumb, i}
          <Breadcrumb.Item>
            {#if i === 0}
              <!-- Dashboard - always untruncated and linked -->
              <Breadcrumb.Link
                href={crumb.href}
                class="truncate"
                data-sveltekit-preload-data="hover"
              >
                {crumb.label}
              </Breadcrumb.Link>
            {:else if i === breadcrumbs.length - 1 && crumb.href.includes("/box/")}
              <!-- Box page - truncated -->
              <Breadcrumb.Page class="truncate max-w-[16vw]">
                {crumb.label}
              </Breadcrumb.Page>
            {:else if i === breadcrumbs.length - 1 && crumb.href.includes("/room/")}
              <!-- Room page - only project and room truncated -->
              <Breadcrumb.Page
                class={i > 1 ? "truncate max-w-[16vw]" : "truncate"}
              >
                {crumb.label}
              </Breadcrumb.Page>
            {:else}
              <!-- All other links - conditionally truncated -->
              <Breadcrumb.Link
                href={crumb.href}
                class={breadcrumbs.some((b) => b.href.includes("/box/")) ||
                (crumb.href.includes("/room/") && i > 1)
                  ? "truncate max-w-[16vw]"
                  : "truncate"}
                data-sveltekit-preload-data="hover"
              >
                {crumb.label}
              </Breadcrumb.Link>
            {/if}
          </Breadcrumb.Item>
          {#if i < breadcrumbs.length - 1}
            <Breadcrumb.Separator class="mx-1" />
          {/if}
        {/each}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  </div>
{/if}
