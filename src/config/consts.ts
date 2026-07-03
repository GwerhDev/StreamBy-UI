import { faCode, faCubes, faDiagramProject, faFileExport, faHeadphones, faImage, faUsers, faVideo, faFingerprint, faShield, faComments, faBoxArchive, faBriefcase, faServer, faClipboardList, faSitemap } from "@fortawesome/free-solid-svg-icons";

export const dashboardDirectoryList = [
  { name: "Overview", icon: faDiagramProject, path: "dashboard/overview" },
  { name: "Members", icon: faUsers, path: "dashboard/members" },
];

export const workflowSubDirectoryList = [
  { name: "Production", icon: faClipboardList, path: "production" },
  { name: "Jobs", icon: faBriefcase, path: "jobs" },
  { name: "Reviews", icon: faComments, path: "reviews" },
  { name: "Render Farm", icon: faServer, path: "render-farm" },
  { name: "Deliverables", icon: faBoxArchive, path: "deliverables" },
];

export const workflowsDirectoryList = [
  { name: "Workflows", icon: faSitemap, path: "workflows" },
];

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

export const apiDirectoryList = [
  { name: "API", icon: faCode, path: "connections/api" },
];

export const settingsDirectoryList = [
  { name: "Credentials", icon: faFingerprint, path: "settings/credentials" },
  { name: "Permissions", icon: faShield, path: "settings/permissions" },
];