import { createContext } from 'react';

/** Allows leaving even while a mandatory game dialog owns the top layer. */
export const RoomExitContext = createContext<(() => void) | null>(null);
