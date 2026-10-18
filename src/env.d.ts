/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
        /** The signed-in user's e-mail, set by src/middleware.ts on /radgiver pages. */
        epost?: string;
    }
}
