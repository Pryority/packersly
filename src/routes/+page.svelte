<script>
    import ArrowRight from "lucide-svelte/icons/arrow-right";
    import CheckCircle from "lucide-svelte/icons/check-circle";
    import PaintBucket from "lucide-svelte/icons/paint-bucket";
    import Scan from "lucide-svelte/icons/scan";
    import Map from "lucide-svelte/icons/map";
</script>

<div class="min-h-screen bg-gradient-to-b from-primary-foreground to-blue-50">
    <!-- Hero Section -->
    <header class="container mx-auto px-4 py-16 md:py-24">
        <div class="text-center">
            <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Moving Made <span class="text-primary">Simple</span>
            </h1>
            <p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Organize your move with smart color coding and QR codes. Never
                lose track of your belongings again.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                    href="/login"
                    class="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-blue-700 transition"
                >
                    Get Started
                    <ArrowRight class="ml-2 h-5 w-5" />
                </a>
                <button
                    class="inline-flex items-center px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-blue-50 transition"
                >
                    Learn More
                </button>
            </div>
        </div>
    </header>

    <!-- Features Section -->
    <section class="py-16 bg-primary-foreground">
        <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-12">
                How Packersly Works
            </h2>
            <div class="grid md:grid-cols-3 gap-8">
                <div
                    class="text-center p-6 rounded-lg hover:shadow-lg transition"
                >
                    <div
                        class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4"
                    >
                        <PaintBucket class="h-8 w-8 text-primary" />
                    </div>
                    <h3 class="text-xl font-semibold mb-3">Color Code</h3>
                    <p class="text-gray-600">
                        Assign colors to rooms and boxes for instant visual
                        organization
                    </p>
                </div>
                <div
                    class="text-center p-6 rounded-lg hover:shadow-lg transition"
                >
                    <div
                        class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4"
                    >
                        <Scan class="h-8 w-8 text-primary" />
                    </div>
                    <h3 class="text-xl font-semibold mb-3">QR Codes</h3>
                    <p class="text-gray-600">
                        Generate unique QR codes for each box to track contents
                        instantly
                    </p>
                </div>
                <div
                    class="text-center p-6 rounded-lg hover:shadow-lg transition"
                >
                    <div
                        class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4"
                    >
                        <Map class="h-8 w-8 text-primary" />
                    </div>
                    <h3 class="text-xl font-semibold mb-3">Room Mapping</h3>
                    <p class="text-gray-600">
                        Organize boxes by room for efficient unpacking at your
                        new location
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Benefits Section -->
    <section class="py-16 bg-gray-50">
        <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-12">
                Why Choose Packersly?
            </h2>
            <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div class="flex items-start">
                    <CheckCircle
                        class="h-6 w-6 text-primary mt-1 mr-3 flex-shrink-0"
                    />
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Save Time</h3>
                        <p class="text-gray-600">
                            Quick scanning shows box contents without opening
                        </p>
                    </div>
                </div>
                <div class="flex items-start">
                    <CheckCircle
                        class="h-6 w-6 text-primary mt-1 mr-3 flex-shrink-0"
                    />
                    <div>
                        <h3 class="text-lg font-semibold mb-2">
                            Stay Organized
                        </h3>
                        <p class="text-gray-600">
                            Color coding system keeps everything in order
                        </p>
                    </div>
                </div>
                <div class="flex items-start">
                    <CheckCircle
                        class="h-6 w-6 text-primary mt-1 mr-3 flex-shrink-0"
                    />
                    <div>
                        <h3 class="text-lg font-semibold mb-2">
                            Reduce Stress
                        </h3>
                        <p class="text-gray-600">
                            Know exactly where everything is during your move
                        </p>
                    </div>
                </div>
                <div class="flex items-start">
                    <CheckCircle
                        class="h-6 w-6 text-primary mt-1 mr-3 flex-shrink-0"
                    />
                    <div>
                        <h3 class="text-lg font-semibold mb-2">
                            Easy Unpacking
                        </h3>
                        <p class="text-gray-600">
                            Room-based organization makes settling in simple
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16">
        <div class="container mx-auto px-4 text-center">
            <div
                class="bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 max-w-4xl mx-auto"
            >
                <h2 class="text-3xl font-bold mb-4">
                    Ready to Start Packing Smarter?
                </h2>
                <p class="text-xl mb-8">
                    Join thousands of movers who are staying organized with
                    Packersly
                </p>
                <a
                    href="/login"
                    class="inline-flex items-center px-8 py-4 bg-primary-foreground text-primary rounded-lg hover:bg-blue-50 transition font-semibold"
                >
                    Get Started Now
                    <ArrowRight class="ml-2 h-5 w-5" />
                </a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-300 py-12">
        <div class="container mx-auto px-4">
            <div class="grid md:grid-cols-4 gap-8">
                <div>
                    <h3 class="text-xl font-bold text-primary-foreground mb-4">
                        Packersly
                    </h3>
                    <p class="text-sm">
                        Making moving organization simple and efficient
                    </p>
                </div>
                <div>
                    <h4 class="font-semibold text-primary-foreground mb-4">
                        Features
                    </h4>
                    <ul class="space-y-2 text-sm">
                        <li>Color Coding</li>
                        <li>QR Tracking</li>
                        <li>Room Mapping</li>
                        <li>Item Management</li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-semibold text-primary-foreground mb-4">
                        Company
                    </h4>
                    <ul class="space-y-2 text-sm">
                        <li>About Us</li>
                        <li>Contact</li>
                        <li>Privacy Policy</li>
                        <li>Terms of Service</li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-semibold text-primary-foreground mb-4">
                        Connect
                    </h4>
                    <ul class="space-y-2 text-sm">
                        <li>Twitter</li>
                        <li>Facebook</li>
                        <li>Instagram</li>
                        <li>LinkedIn</li>
                    </ul>
                </div>
            </div>
            <div
                class="border-t border-gray-800 mt-12 pt-8 text-center text-sm"
            >
                <p>© 2024 Packersly. All rights reserved.</p>
            </div>
        </div>
    </footer>
</div>
