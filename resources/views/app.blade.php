<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
        <!-- PLUMY landing fonts (Montserrat support Cyrillic) -->
        <link href="https://fonts.bunny.net/css?family=montserrat:400,500,600,700%7Ccaveat:500,600,700&display=swap" rel="stylesheet" />
        <!-- Landing OTTA (TokaPark × Wahanaku style) -->
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&display=swap" rel="stylesheet" />
        <!-- VURASI landing — display art-deco & italic editorial -->
        <link href="https://fonts.bunny.net/css?family=poiret-one:400%7Cplayfair-display:400i,500i,600i&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
