import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import type { BoxWithRelations, ProjectData } from "@types";
import { and, eq, like, ne } from "drizzle-orm";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
  y?: number;
  x?: number;
  start?: number;
  duration?: number;
};

export const flyAndScale = (
  node: Element,
  params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 },
): TransitionConfig => {
  const style = getComputedStyle(node);
  const transform = style.transform === "none" ? "" : style.transform;

  const scaleConversion = (
    valueA: number,
    scaleA: [number, number],
    scaleB: [number, number],
  ) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;

    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;

    return valueB;
  };

  const styleToString = (
    style: Record<string, number | string | undefined>,
  ): string => {
    return Object.keys(style).reduce((str, key) => {
      if (style[key] === undefined) return str;
      return str + `${key}:${style[key]};`;
    }, "");
  };

  return {
    duration: params.duration ?? 200,
    delay: 0,
    css: (t) => {
      const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
      const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

      return styleToString({
        transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity: t,
      });
    },
    easing: cubicOut,
  };
};

export function getUserInitials(
  firstName: string | undefined,
  lastName: string | undefined,
  username: string | undefined,
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  } else if (firstName && !lastName) {
    return firstName[0].toUpperCase();
  } else if (!firstName && lastName) {
    return lastName[0].toUpperCase();
  } else if ((!firstName || !lastName) && username !== undefined)
    return username[0].toUpperCase();
  return "";
}

export function generateHandle(name: string): string {
  // First normalize the string to decompose accented characters
  const normalized = name
    .normalize("NFD")
    // Remove diacritics (accents)
    .replace(/[\u0300-\u036f]/g, "")
    // Convert to lowercase
    .toLowerCase()
    // Replace non-alphanumeric characters (except hyphens) with hyphens
    .replace(/[^a-z0-9-]+/g, "-")
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-{2,}/g, "-");

  if (normalized.length < 3 || normalized.length > 50) {
    throw new Error("Handle length must be between 3 and 50 characters");
  }

  return normalized;
}

export function getTotalRooms(project: ProjectData): number {
  return project.rooms.length;
}

export function getTotalBoxes(project: ProjectData): number {
  return project.rooms.reduce((total, room) => {
    return total + (Array.isArray(room.boxes) ? room.boxes.length : 0);
  }, 0);
}

export function getTotalItems(project: ProjectData): number {
  return project.rooms.reduce((roomTotal, room) => {
    return (
      roomTotal +
      room.boxes.reduce((boxTotal, box) => {
        if (!box.items) return boxTotal;
        return (
          boxTotal +
          box.items.reduce((itemTotal, item) => {
            return itemTotal + (item.quantity || 1);
          }, 0)
        );
      }, 0)
    );
  }, 0);
}

export function getTotalItemsOfBoxes(boxes: BoxWithRelations[]): number {
  if (!boxes || boxes.length === 0) return 0;

  return boxes.reduce((boxTotal, box) => {
    const itemsTotal = box.items
      ? box.items.reduce(
          (itemTotal, item) => itemTotal + (item.quantity || 1),
          0,
        )
      : 0;

    return boxTotal + itemsTotal;
  }, 0);
}

export function getProjectStats(
  projects: ProjectData[],
  status: "active" | "draft" | "completed",
) {
  const filteredProjects = projects?.filter((p) => p.status === status) ?? [];

  return {
    count: filteredProjects.length,
    boxCount: filteredProjects.reduce((total, project) => {
      return total + getTotalBoxes(project);
    }, 0),
    itemCount: filteredProjects.reduce((total, project) => {
      return total + getTotalItems(project);
    }, 0),
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
