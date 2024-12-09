<!-- src/lib/components/auth/RegisterForm.svelte -->
<script lang="ts">
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation";
    import { Button } from "@components/ui/button";
    import { Input } from "@components/ui/input";
    import { Label } from "@components/ui/label";
    import { Switch } from "@components/ui/switch";
    import type { ActionResult, Actions } from "@sveltejs/kit";

    const { form }: { form: Actions } = $props();
    let submitting = $state(false);
    let isAgent = $state(false);

    function handleSubmit({ formData }: { formData: FormData }) {
        submitting = true;
        console.log("Form data:", Object.fromEntries(formData));
        return async ({ result }: { result: ActionResult }) => {
            console.log("Form submission result:", result);

            submitting = false;

            if (result.type === "redirect") {
                console.log("Redirecting to:", result.location);
                goto(result.location); // Perform the client-side navigation
            } else if (result.type === "failure") {
                console.log("Submission failed:", result.data);
            }

            submitting = false;
        };
    }
</script>

<form method="POST" action="?/register" use:enhance={handleSubmit}>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <div class="space-y-0.5">
                <Label>Account Type</Label>
                <div class="text-sm text-muted-foreground">
                    {isAgent
                        ? "Agent account for managing properties"
                        : "Client account for moving"}
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <Label for="user-type">{isAgent ? "Agent" : "Client"}</Label>
                <Switch
                    id="user-type"
                    name="user_type"
                    checked={isAgent}
                    value={isAgent ? "agent" : "client"}
                    onCheckedChange={(checked) => (isAgent = checked)}
                />
            </div>
        </div>

        <div>
            <Label for="first_name">First Name</Label>
            <Input
                type="text"
                name="first_name"
                id="first_name"
                required
                placeholder="Enter your first name"
            />
        </div>

        <div>
            <Label for="last_name">Last Name</Label>
            <Input
                type="text"
                name="last_name"
                id="last_name"
                required
                placeholder="Enter your last name"
            />
        </div>

        <div>
            <Label for="email">Email</Label>
            <Input
                type="email"
                name="email"
                id="email"
                autocomplete="email"
                required
                placeholder="Enter your email"
            />
        </div>

        <div>
            <Label for="password">Password</Label>
            <Input
                type="password"
                name="password"
                id="password"
                autocomplete="new-password"
                required
                placeholder="Enter your password"
            />
        </div>

        <div>
            <Label for="confirm_password">Confirm Password</Label>
            <Input
                type="password"
                name="confirm_password"
                id="confirm_password"
                autocomplete="new-password"
                required
                placeholder="Confirm your password"
            />
        </div>

        {#if form?.error}
            <div class="text-red-500 text-sm mt-2">
                {#if typeof form.error === "string"}
                    {form.error}
                {:else}
                    {Object.entries(form.error)
                        .map(([field, message]) => `${field}: ${message}`)
                        .join(", ")}
                {/if}
            </div>
        {/if}

        <Button type="submit" disabled={submitting} class="w-full">
            {submitting ? "Creating account..." : "Create Account"}
        </Button>

        <div class="mt-4 text-center text-sm">
            <span>Already have an account? </span>
            <a href="/login" class="text-blue-600 hover:text-blue-800">Login</a>
        </div>
    </div>
</form>
