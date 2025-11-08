export default defineNuxtConfig({
    components: [
        {
            path: '~/components',
            pathPrefix: false, // [!code ++]
        },
    ],
})
