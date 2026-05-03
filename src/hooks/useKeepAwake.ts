import React from "react";
import { usePlaybackStore } from "../store/playbackStore";
import { KeepAwake } from "../lib/KeepAwake";

export const useKeepAwake = () => {
    // This hook will keep the screen awake
    const {
        isPlaying,
    } = usePlaybackStore();
    const keepWake = React.useRef<KeepAwake | null>(null);

    React.useEffect(() => {
        async function activateKeepAwake() {
            if (!KeepAwake.isAPIAvailable()) {
                return;
            }
            keepWake.current?.destroy();
            if (isPlaying) {
                keepWake.current = new KeepAwake();
                await keepWake.current?.activate();
            }
        }
        activateKeepAwake();

        return () => {
            keepWake.current?.destroy();
            keepWake.current = null;
        };
    }, [isPlaying]);
};
