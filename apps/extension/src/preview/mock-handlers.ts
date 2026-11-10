import type { PayloadOf, ResponseOf, RouterMessageType } from "@/background/router/contracts";

export type MockHandlers = { [K in RouterMessageType]?: (payload: PayloadOf<K>) => ResponseOf<K> | Promise<ResponseOf<K>> };