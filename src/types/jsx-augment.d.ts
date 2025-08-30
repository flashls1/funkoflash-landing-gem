
// Allows passing `language` and `targetUserId` to components without TS error.
// We will migrate to useLanguage() later; this unblocks builds now.
declare namespace JSX {
  interface IntrinsicAttributes {
    language?: "es" | "en";
    targetUserId?: string;
  }
}
