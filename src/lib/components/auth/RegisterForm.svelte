<!-- src/lib/components/auth/RegisterForm.svelte -->
<script lang="ts">
    import { Button } from "@components/ui/button";
    import { Input } from "@components/ui/input";
    import { Label } from "@components/ui/label";
    import { Switch } from "@components/ui/switch";
    import * as Form from "@components/ui/form";
    import type { ActionResult } from "@sveltejs/kit";
    import {
        type SuperValidated,
        type Infer,
        superForm,
    } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { registerSchema, type RegisterSchema } from "@routes/settings/zod";

    const { data }: { data: SuperValidated<Infer<RegisterSchema>> } = $props();

    const form = superForm(data, {
        validators: zodClient(registerSchema),
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

    const { form: formData, enhance } = form;

    let submitting = $state(false);
    let isAgent = $state(false);
</script>

<form method="POST" use:enhance>
    <div class="space-y-4">
        <Form.Field
            {form}
            name="userType"
            class="flex w-full items-center justify-between"
        >
            <Label>Account Type</Label>

            <div class="flex flex-col items-end gap-1">
                <Form.Control let:attrs>
                    <div class="flex items-center space-x-2">
                        <Form.Label>{isAgent ? "Agent" : "Client"}</Form.Label>
                        <input
                            type="hidden"
                            name="userType"
                            bind:value={$formData.userType}
                        />
                        <Switch
                            {...attrs}
                            checked={isAgent}
                            onCheckedChange={(checked) => {
                                isAgent = checked;
                                $formData.userType = checked
                                    ? "agent"
                                    : "client";
                            }}
                        />
                    </div>
                </Form.Control>

                <Form.Description>
                    {isAgent
                        ? "Agent account for managing properties"
                        : "Client account for moving"}
                </Form.Description>
                <Form.FieldErrors />
            </div>
        </Form.Field>

        <Form.Field {form} name="firstName">
            <Form.Control let:attrs>
                <Form.Label>First Name</Form.Label>
                <Input
                    {...attrs}
                    type="text"
                    placeholder="Enter your first name"
                    autocomplete="given-name"
                    bind:value={$formData.firstName}
                />
            </Form.Control>
            <Form.Description>
                Your first name as it appears on official documents
            </Form.Description>
            <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="lastName">
            <Form.Control let:attrs>
                <Form.Label>Last Name</Form.Label>
                <Input
                    {...attrs}
                    type="text"
                    placeholder="Enter your last name"
                    autocomplete="family-name"
                    bind:value={$formData.lastName}
                />
            </Form.Control>
            <Form.Description>
                Your last name as it appears on official documents
            </Form.Description>
            <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="email">
            <Form.Control let:attrs>
                <Form.Label>Email</Form.Label>
                <Input
                    {...attrs}
                    type="email"
                    placeholder="Enter your email"
                    autocomplete="email"
                    bind:value={$formData.email}
                />
            </Form.Control>
            <Form.Description>
                This will be used for account verification and communications
            </Form.Description>
            <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="password">
            <Form.Control let:attrs>
                <Form.Label>Password</Form.Label>
                <Input
                    {...attrs}
                    type="password"
                    placeholder="Enter your password"
                    autocomplete="new-password"
                    bind:value={$formData.password}
                />
            </Form.Control>
            <Form.Description>
                Must be at least 8 characters long
            </Form.Description>
            <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="confirmPassword">
            <Form.Control let:attrs>
                <Form.Label>Confirm Password</Form.Label>
                <Input
                    {...attrs}
                    type="password"
                    placeholder="Confirm your password"
                    autocomplete="new-password"
                    bind:value={$formData.confirmPassword}
                />
            </Form.Control>
            <Form.Description>
                Re-enter your password to confirm
            </Form.Description>
            <Form.FieldErrors />
        </Form.Field>

        <Button type="submit" disabled={submitting} class="w-full">
            {submitting ? "Creating account..." : "Create Account"}
        </Button>

        <div class="mt-4 text-center text-sm">
            <span>Already have an account? </span>
            <a href="/login" class="text-blue-600 hover:text-blue-800">Login</a>
        </div>
    </div>
</form>
