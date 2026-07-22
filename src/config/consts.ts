import { faCode, faCubes, faDiagramProject, faFileExport, faHeadphones, faImage, faUsers, faVideo, faFingerprint, faShield, faComments, faBoxArchive, faBriefcase, faClipboardList, faKey } from "@fortawesome/free-solid-svg-icons";
import type { WorkflowGroup } from "../app/components/NodeViewer/nodePalette";

export const dashboardDirectoryList = [
  { name: "Overview", icon: faDiagramProject, path: "dashboard/overview" },
  { name: "Members", icon: faUsers, path: "dashboard/members" },
];

// Workflow sidebar sections, keyed by the same WorkflowGroup taxonomy nodePalette.ts uses.
// A section is shown only when the Workflow canvas has an instantiated node of that group
// (see LateralMenu's derivation from workflow.nodeSchema.nodes) — this map only carries
// display metadata (label/icon/path), not visibility.
export const WORKFLOW_SECTION_BY_GROUP: Partial<Record<WorkflowGroup, { name: string; icon: typeof faClipboardList; path: string }>> = {
  production: { name: "Production", icon: faClipboardList, path: "production" },
  process: { name: "Jobs", icon: faBriefcase, path: "jobs" },
  review: { name: "Reviews", icon: faComments, path: "reviews" },
  delivery: { name: "Deliverables", icon: faBoxArchive, path: "deliverables" },
};

export const exportsDirectoryList = [
  { name: "Exports", icon: faFileExport, path: "exports" },
];

export const storageDirectoryList = [
  { name: "Images", icon: faImage, path: "images" },
  { name: "Audios", icon: faHeadphones, path: "audios" },
  { name: "Videos", icon: faVideo, path: "videos" },
  { name: "3D Models", icon: faCubes, path: "3d-models" },
];

// databaseDirectoryList removed — Database section now uses dynamic DB connections routing.

export const connectionsDirectoryList = [
  { name: "API", icon: faCode, path: "connections/api" },
  { name: "Credentials", icon: faFingerprint, path: "connections/credentials" },
];

export const settingsDirectoryList = [
  { name: "API Tokens", icon: faKey, path: "settings/api-tokens" },
  { name: "Permissions", icon: faShield, path: "settings/permissions" },
];