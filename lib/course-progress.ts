import type { CertTrack } from "./data/certifications";
import type { DeviceLearning } from "./device-history";

/** The ids of the course modules completed on this device */
export function completedModules(learning: DeviceLearning[], track: CertTrack): Set<string> {
  return new Set(
    learning.filter((entry) => entry.track === track.id).map((entry) => entry.module)
  );
}

/** A course is complete when every one of its modules is */
export function isCourseComplete(learning: DeviceLearning[], track: CertTrack): boolean {
  const done = completedModules(learning, track);
  return track.modules.every((module) => done.has(module.id));
}

/** Where to pick the course up: the first module not yet completed */
export function firstOpenModule(learning: DeviceLearning[], track: CertTrack): number {
  const done = completedModules(learning, track);
  const index = track.modules.findIndex((module) => !done.has(module.id));
  return index === -1 ? 0 : index;
}
