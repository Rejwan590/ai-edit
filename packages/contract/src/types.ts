// ===== Shared contract: MotionForge Studio (UI <-> core) =====
export type ProjectMode = 'edit' | 'generate' | 'hybrid';
export type AssetRole = 'a-roll' | 'screen' | 'b-roll' | 'music' | 'voice' | 'reference';

export interface ApiError { code: string; message: string; detail?: string } // codes: not_built, bridge_missing, agent_not_found, not_signed_in, timeout, tool_failed, invalid_op, ...

export interface ProjectMeta {
  id: string; name: string; path: string; mode: ProjectMode;
  createdAt: string; updatedAt: string; posterRelPath?: string; version: number; // document version
}

export interface Asset {
  id: string; relPath: string; name: string; role: AssetRole; sizeBytes: number;
  durationSec?: number; width?: number; height?: number; fps?: number; hasAudio?: boolean;
  thumbRelPath?: string; status: 'ready' | 'probing' | 'error'; error?: string;
}
export interface ReferenceItem { id: string; relPath: string; notes: string }

// ----- Transcript -----
export interface Word { w: string; start: number; end: number; filler?: boolean; sceneId?: string }
export interface Transcript {
  source: 'whisper' | 'script' | 'estimated'; language: string; words: Word[];
  pauses: { start: number; end: number }[]; // pauses >= 0.5 s
}

// ----- Timeline document -----
export type TrackType = 'overlays' | 'captions' | 'scenes' | 'video' | 'voice' | 'audio';
export type ClipKind = 'video' | 'audio' | 'card' | 'caption-block' | 'scene' | 'image';
export interface EffectInstance { id: string; params: Record<string, number | string | boolean> }
export interface Clip {
  id: string; kind: ClipKind; at: number; dur: number;
  assetId?: string; in?: number; out?: number;                 // source range for media clips
  props?: Record<string, unknown>;                              // card title, items, scene title, media source...
  effects?: EffectInstance[];
  by: 'user' | 'agent'; why?: string; runId?: string;           // provenance
  warnings?: ('overlaps-face' | 'out-of-range' | 'overlap-track')[];
  mediaSource?: 'motion' | 'asset' | 'stock' | 'ai';            // scenes
}
export interface Track { id: string; type: TrackType; name: string; muted?: boolean; locked?: boolean; hidden?: boolean; clips: Clip[] }
export interface Box { x: number; y: number; w: number; h: number } // fractions 0..1 of the frame
export interface SafeZones { face?: Box; caption?: Box; card?: Box }
export interface Marker { id: string; t: number; note: string }
export interface TimelineDoc {
  version: number; fps: number; width: number; height: number; durationSec: number;
  preset: 'youtube' | 'vertical' | 'square';
  lookId: string; look: Look;
  tracks: Track[]; markers: Marker[]; safeZones: SafeZones;
  cutRanges: { start: number; end: number }[];                  // removed from the video track
  render?: { engine: 'ui-approx' | 'shared' };
}

// ----- Operations (the only way to change the document) -----
export type Op =
  | { op: 'add_clip'; trackId: string; clip: Omit<Clip, 'id' | 'by'> }
  | { op: 'move_clip'; clipId: string; at: number; trackId?: string; ripple?: boolean }
  | { op: 'trim_clip'; clipId: string; at?: number; dur?: number; in?: number; out?: number }
  | { op: 'split_clip'; clipId: string; t: number }
  | { op: 'delete_clip'; clipId: string }
  | { op: 'set_clip_props'; clipId: string; props: Record<string, unknown> }
  | { op: 'cut_range'; start: number; end: number }
  | { op: 'speed_range'; start: number; end: number; speed: number }
  | { op: 'add_track'; track: Omit<Track, 'id' | 'clips'> }
  | { op: 'apply_effect'; clipId?: string; at?: number; dur?: number; effect: EffectInstance }
  | { op: 'update_effect'; clipId: string; effectIndex: number; params: Record<string, number | string | boolean> }
  | { op: 'remove_effect'; clipId: string; effectIndex: number }
  | { op: 'set_look'; lookId?: string; patch?: Partial<Look> }
  | { op: 'add_marker'; t: number; note: string }
  | { op: 'batch'; ops: Op[]; label?: string };
export interface OpResult { ok: boolean; version: number; error?: ApiError }

export interface VersionEntry { version: number; at: string; by: 'user' | 'agent'; label: string; runId?: string }

// ----- Styles, looks, effects -----
export interface Look {
  palette: { bg: string; text: string; accent: string; highlight: string };
  fonts: { heading: string; body: string; bengaliFallback?: string };
  captions: { position: 'tl'|'tc'|'tr'|'ml'|'mc'|'mr'|'bl'|'bc'|'br'; size: number; uppercase: boolean; wordsPerChunk: number; highlight: 'color'|'box'|'underline'; maxLines: number };
  cards: { radius: number; shadow: boolean; position: 'right-wall'|'left-wall'|'lower-third' };
  motion: 'calm' | 'normal' | 'snappy';
  logoAssetId?: string;
}
export interface StyleInfo {
  id: string; name: string; description: string; bestLength: string; footage: string[]; avoidWhen: string;
  tags: string[]; look: Look; motif: string; exampleEffects: string[];
}
export interface QuestionnaireQuestion { id: string; label: string; type: 'single' | 'multi'; options: { id: string; label: string }[] }
export interface StyleResult {
  ranking: { styleId: string; score: number; reasons: string[]; warnings: string[] }[];
  excluded: { styleId: string; reason: string }[]; chosen?: string;
}
export type ParamDef =
  | { type: 'number'; min: number; max: number; default: number; step?: number; unit?: string }
  | { type: 'enum'; options: string[]; default: string }
  | { type: 'boolean'; default: boolean }
  | { type: 'color'; default: string };
export interface EffectInfo {
  id: string; name: string; group: 'emphasis'|'text'|'graphics'|'transitions'|'look'|'audio';
  description: string; needs?: string[]; params: Record<string, ParamDef>; safety?: string;
  scope: ('moment' | 'clip' | 'whole')[];
}

// ----- Chat, agent, jobs -----
export interface Attachment { assetId: string; name: string; role: AssetRole }
export interface ChatRef { type: 'clip' | 'asset' | 'time'; id?: string; t?: number }
export interface Change { id: string; kind: 'cut'|'caption'|'card'|'effect'|'look'|'sound'|'scene'; label: string; range?: [number, number]; before?: string; after?: string }
export type ChatEvent =
  | { type: 'chat:delta'; runId: string; text: string }
  | { type: 'chat:step'; runId: string; stepId: string; label: string; status: 'running'|'done'|'error'; tool?: string; summary?: string; durationMs?: number }
  | { type: 'chat:proposal'; runId: string; proposalId: string; changes: Change[] }
  | { type: 'chat:note'; runId: string; text: string; link?: 'render-report' }
  | { type: 'chat:done'; runId: string }
  | { type: 'chat:error'; runId: string; error: ApiError };
export interface AgentStatus { provider: string; providerName?: string; transport?: Transport; found: boolean; signedIn: boolean; running: boolean; model?: string; version?: string; lastRun?: { at: string; ok: boolean } }
export interface DoctorTool { name: 'ffmpeg'|'ffprobe'|'whisper'|'tts'|'chromium'|string; required: boolean; found: boolean; version?: string; path?: string; error?: string; installHint?: string }
// ----- Connections (every way to reach an agent) -----
export type Transport = 'sdk' | 'cli' | 'mcp-client' | 'api' | 'custom';
export interface ProviderField {
  key: string; label: string; type: 'text' | 'select' | 'path' | 'boolean' | 'number';
  options?: string[]; placeholder?: string; help?: string; // never a secret: secrets are entered in a native dialog
}
export interface ProviderCapabilities {
  streaming: boolean | null; vision: boolean | null; toolUse: 'native' | 'mcp' | 'text' | null; models: string[] | null; // null = unknown (not tested)
}
export interface ProviderInfo {
  id: string; name: string; transport: Transport; description: string; docsUrl?: string;
  fields: ProviderField[]; values: Record<string, string | number | boolean>;
  capabilities: ProviderCapabilities; status: AgentStatus;
  needsKey: boolean; keyPresent: boolean;
  recommended?: { reason: string };           // set by the core from test results, never by the UI
  lastTest?: ConnectionTestResult;
}
export interface ConnectionTestStep {
  id: 'found' | 'auth' | 'hello' | 'stream' | 'tool' | 'image' | 'policy' | 'models';
  label: string; status: 'pending' | 'running' | 'pass' | 'fail' | 'skipped'; detail?: string;
}
export interface ConnectionTestResult { providerId: string; at: string; steps: ConnectionTestStep[]; done: boolean }
export interface McpServerInfo {
  enabled: boolean; endpoint?: string; tokenPresent: boolean;
  tools: { name: string; description: string; lastCalledAt?: string }[];
  configSnippets: { client: string; snippet: string; pathHint: string }[];
}
export interface UsageEntry { runId: string; at: string; provider: string; model?: string; tokensIn?: number; tokensOut?: number; toolCalls: number; sent: { textChars: number; frames: number } }

export type JobType = 'transcribe' | 'render_preview' | 'render_final' | 'generate_voice' | 'make_scene' | 'proxy' | 'thumbnails' | 'probe';
export interface Job {
  id: string; type: JobType; status: 'queued'|'running'|'succeeded'|'failed'|'cancelled';
  progress?: number; // 0..1, absent or -1 = unknown
  startedAt?: string; endedAt?: string; logTail?: string[]; outputRelPath?: string;
  error?: { command: string; exitCode: number; stderrTail: string };
}
export interface VerifyReport { checks: { id: string; label: string; ok: boolean; detail?: string }[]; frames: string[]; audioChecksum?: string }

export interface FsEntry { relPath: string; name: string; isDir: boolean; sizeBytes?: number; modifiedAt?: string; status?: 'ready' | 'pending' }
export interface Settings {
  projectsDir: string; language: string; provider: string; fallbackOrder: string[]; model?: string;
  whisperModel: 'tiny'|'base'|'small'|'medium'; ttsEngine: string; defaultVoice?: string;
  sendFramesToModel: boolean; media: { stock: boolean; aiImage: boolean; aiClip: boolean };
}

// ----- Events from core to UI -----
export type CoreEvent =
  | ChatEvent
  | { type: 'doc:update'; version: number; doc: TimelineDoc }
  | { type: 'draft:update'; draftId: string; doc: TimelineDoc }
  | { type: 'job:update'; job: Job }
  | { type: 'upload:progress'; clientId: string; loaded: number; total: number }
  | { type: 'agent:status'; status: AgentStatus }
  | { type: 'doctor'; tools: DoctorTool[] }
  | { type: 'provider:status'; providerId: string; status: AgentStatus }
  | { type: 'provider:test'; result: ConnectionTestResult }
  | { type: 'mcp:call'; tool: string; at: string; external: boolean }
  | { type: 'fs:change'; relPaths: string[] };

// ===== ApiClient (src/api/client.ts) =====
export interface ApiClient {
  mode: 'ipc' | 'http' | 'demo';
  subscribe(cb: (e: CoreEvent) => void): () => void;
  // projects
  listProjects(): Promise<ProjectMeta[]>;
  createProject(p: { name: string; mode: ProjectMode }): Promise<ProjectMeta>;
  openProject(id: string): Promise<{ meta: ProjectMeta; doc: TimelineDoc | null; transcript: Transcript | null }>;
  pickProjectFolder(): Promise<ProjectMeta | null>;
  renameProject(id: string, name: string): Promise<ProjectMeta>;
  deleteProject(id: string): Promise<{ ok: true }>;
  revealFolder(relPath?: string): Promise<{ ok: true }>;
  // files and assets
  pickFiles(): Promise<{ clientId: string; name: string; size: number }[]>;
  uploadAssets(projectId: string, files: File[] | { clientId: string }[], role?: AssetRole): Promise<Asset[]>;
  listAssets(projectId: string): Promise<Asset[]>;
  setAssetRole(projectId: string, assetId: string, role: AssetRole): Promise<Asset>;
  removeAsset(projectId: string, assetId: string): Promise<{ ok: true }>;
  listReferences(projectId: string): Promise<ReferenceItem[]>;
  saveReferenceNotes(projectId: string, id: string, notes: string): Promise<ReferenceItem>;
  fileUrl(projectId: string, relPath: string): string;
  thumbnails(projectId: string, assetId: string): Promise<string[]>;
  waveform(projectId: string, assetId: string): Promise<number[]>;
  tree(projectId: string): Promise<FsEntry[]>;
  // timeline
  applyOps(projectId: string, ops: Op[], label?: string): Promise<OpResult>;
  undo(projectId: string): Promise<OpResult>;
  redo(projectId: string): Promise<OpResult>;
  history(projectId: string): Promise<VersionEntry[]>;
  restoreVersion(projectId: string, version: number): Promise<OpResult>;
  getTranscript(projectId: string): Promise<Transcript | null>;
  runTool(projectId: string, tool: string, args?: Record<string, unknown>): Promise<Job>;
  // styles, effects, look
  listStyles(): Promise<StyleInfo[]>;
  getQuestionnaire(): Promise<QuestionnaireQuestion[]>;
  scoreStyles(projectId: string, answers: Record<string, string | string[]>): Promise<StyleResult>;
  listEffects(): Promise<EffectInfo[]>;
  setLook(projectId: string, p: { lookId?: string; patch?: Partial<Look> }): Promise<OpResult>;
  // chat and agent
  sendChat(projectId: string, m: { message: string; assetIds?: string[]; refs?: ChatRef[] }): Promise<{ runId: string }>;
  cancelRun(runId: string): Promise<{ ok: true }>;
  resolveProposal(projectId: string, runId: string, proposalId: string, approve: { all?: boolean; changeIds?: string[]; reject?: boolean }): Promise<OpResult>;
  previewDraft(projectId: string, proposalId: string): Promise<{ videoRelPath?: string }>;
  getAgentStatus(): Promise<AgentStatus>;                      // status of the ACTIVE connection
  listProviders(): Promise<ProviderInfo[]>;
  updateProviderConfig(providerId: string, values: Record<string, string | number | boolean>): Promise<ProviderInfo>;
  setActiveProvider(providerId: string, fallbackOrder?: string[]): Promise<Settings>;
  testProvider(providerId: string): Promise<{ started: true }>; // steps arrive as 'provider:test' events
  addProvider(p: { name: string; transport: Transport; values: Record<string, string | number | boolean> }): Promise<ProviderInfo>;
  removeProvider(providerId: string): Promise<{ ok: true }>;
  requestKeyEntry(providerId: string): Promise<{ ok: boolean }>; // opens a NATIVE dialog; the UI never sees keys
  getMcpServerInfo(): Promise<McpServerInfo>;
  setMcpServerEnabled(enabled: boolean): Promise<McpServerInfo>;
  regenerateMcpToken(): Promise<McpServerInfo>;
  usage(projectId: string): Promise<UsageEntry[]>;
  // jobs, render, settings, doctor
  listJobs(projectId: string): Promise<Job[]>;
  getJob(jobId: string): Promise<Job>;
  cancelJob(jobId: string): Promise<Job>;
  render(projectId: string, o: { kind: 'preview' | 'final'; preset: 'youtube'|'vertical'|'square'; height: 720|1080|2160; fps?: number; audio: 'keep-original' | 'mix'; srt?: boolean; thumbnail?: boolean }): Promise<Job>;
  getVerifyReport(projectId: string, jobId: string): Promise<VerifyReport | null>;
  getSettings(): Promise<Settings>;
  updateSettings(p: Partial<Settings>): Promise<Settings>;
  getDoctor(): Promise<DoctorTool[]>;
  recheckDoctor(): Promise<DoctorTool[]>;
}
