<script lang="ts">
    import { RegisterForm } from "@components/auth";
    import { AuthLayout } from "@components/layout";

    const { data } = $props();
</script>

<svelte:head>
    <title>Register / Packersly</title>
    <meta name="description" content="Register for an account" />
</svelte:head>

<AuthLayout imageUrl="/box-bg.jpg">
    <h1 class="text-2xl font-bold mb-6">Create Your Account</h1>
    <RegisterForm data={data.form} />
</AuthLayout>
