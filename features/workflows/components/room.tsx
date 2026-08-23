"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";

export function Room({ 
    roomId,
    children 
}: { roomId: string, children: ReactNode }) {
  return (
    <LiveblocksProvider 
    throttle={16}
    publicApiKey={"pk_dev_bKm3NhRUKzPnmf1t78NmwpzqFyVUVjoRu3-cECdxkX7nA0qpNTaMloA_eyv0tLoU"}>
      <RoomProvider id="roomId">
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}