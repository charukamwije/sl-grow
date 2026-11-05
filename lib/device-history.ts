"use client";

import { useSyncExternalStore } from "react";
import type { PlannerInputs } from "./planner/calc";

/**
 * Orders and plans kept on this device, so guests can look back at what they
 * sent without an account. Only what the customer needs to follow up is
 * kept - the reference, items and totals - never their name, phone or
 * address (SRS 4.5, 4.6).
 */
export type DeviceOrder = {
  ref: string;
  createdAt: string;
  method: "pickup" | "delivery";
  items: { code: string; name: string; qty: number; lineTotal: number }[];
  total: number;
};

export type DevicePlan = {
  id: string;
  createdAt: string;
  people: number;
  space: number;
  total: number;
  /** What was entered, to show or edit the plan again (missing on older plans) */
  inputs?: PlannerInputs;
};

export const DEVICE_ORDERS_KEY = "aswedduma_orders";
export const DEVICE_PLANS_KEY = "aswedduma_plans";
const MAX_ENTRIES = 50;
const EMPTY: never[] = [];

export type Store<T> = {
  get(): T[];
  add(entry: T): void;
  /** Replaces the entries that match, keeping their place */
  update(match: (entry: T) => boolean, next: T): void;
  remove(match: (entry: T) => boolean): void;
  subscribe(listener: () => void): () => void;
};

export function createStore<T>(key: string): Store<T> {
  let memory: T[] = EMPTY;
  let lastRaw: string | null | undefined;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) notify();
  };

  // Cached against the raw string, so snapshots stay stable between changes
  const get = (): T[] => {
    let raw: string | null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return memory;
    }
    if (raw !== lastRaw) {
      lastRaw = raw;
      try {
        const parsed: unknown = JSON.parse(raw ?? "[]");
        memory = Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        memory = [];
      }
    }
    return memory;
  };

  const save = (next: T[]) => {
    memory = next;
    try {
      const raw = JSON.stringify(next);
      localStorage.setItem(key, raw);
      lastRaw = raw;
    } catch {
      // Private mode or full storage: kept for this visit only
    }
    notify();
  };

  return {
    get,
    // Newest first, and only the most recent few, so storage stays small
    add(entry) {
      save([entry, ...get()].slice(0, MAX_ENTRIES));
    },
    update(match, next) {
      save(get().map((entry) => (match(entry) ? next : entry)));
    },
    remove(match) {
      save(get().filter((entry) => !match(entry)));
    },
    subscribe(listener) {
      if (listeners.size === 0) window.addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
  };
}

export const deviceOrders = createStore<DeviceOrder>(DEVICE_ORDERS_KEY);
export const devicePlans = createStore<DevicePlan>(DEVICE_PLANS_KEY);

export function useDeviceHistory<T>(store: Store<T>): T[] {
  return useSyncExternalStore(store.subscribe, store.get, () => EMPTY);
}

/** Join page: course modules whose quiz was passed on this device (newest first) */
export type DeviceLearning = { track: string; module: string; passedAt: string };

export const DEVICE_LEARNING_KEY = "aswedduma_learning";

export const deviceLearning = createStore<DeviceLearning>(DEVICE_LEARNING_KEY);
