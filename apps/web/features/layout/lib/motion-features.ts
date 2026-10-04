import { domMax } from "motion/react";

// Shared-layout animations (`layoutId`) need `domMax`. Kept in its own module so it can be loaded lazily.
export default domMax;
