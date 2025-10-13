// src/types/events.d.ts
import type { MessagePayload } from "firebase/messaging";

declare global {
  interface WindowEventMap {
    "foreground-push": CustomEvent<MessagePayload>;
  }
}

export {};
