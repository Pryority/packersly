<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "@components/ui/button";
    import { Input } from "@components/ui/input";
    import { Label } from "@components/ui/label";
    import type { Actions } from "@sveltejs/kit";

    const { form }: { form: Actions } = $props();
    let submitting = $state(false);
</script>

<form method="POST" use:enhance>
    <div class="space-y-4">
        <div>
            <Label for="email">Email</Label>
            <Input
                type="email"
                id="email"
                name="email"
                autocomplete="email"
                required
                placeholder="Enter your email"
            />
        </div>

        <div>
            <Label for="password">Password</Label>
            <Input
                type="password"
                id="password"
                name="password"
                autocomplete="current-password"
                required
                placeholder="Enter your password"
            />
        </div>

        {#if form?.error}
            <div class="text-red-500 text-sm mt-2">
                {form.error || "An error occurred"}
            </div>
        {/if}

        <Button type="submit" disabled={submitting} class="w-full">
            {submitting ? "Logging in..." : "Log in"}
        </Button>

        <div class="mt-4 text-center text-sm">
            <span>Don't have an account? </span>
            <a href="/register" class="text-blue-600 hover:text-blue-800"
                >Register</a
            >
        </div>

        <div class="mt-4 text-center text-sm">
            <a href="/password/reset" class="text-blue-600 hover:text-blue-800">
                Forgot your password?
            </a>
        </div>
    </div>
</form>
