<script lang="ts">
    import { LoginForm } from "@components/auth";
    import { AuthLayout } from "@components/layout";
    import type { Actions } from "@sveltejs/kit";

    const { form }: { form: Actions } = $props();
</script>

<svelte:head>
    <title>Login / Packersly</title>
    <meta name="description" content="Login to Packersly" />
</svelte:head>
<AuthLayout imageUrl="/box-bg.jpg">
    <h1 class="text-2xl font-bold mb-6">Login</h1>
    <LoginForm {form} />
</AuthLayout>
