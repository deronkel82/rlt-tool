import type { RltDoc } from '../state/types'

export interface ProjectRecord {
  id: string
  name: string
  anlage: string
  createdAt: number
  updatedAt: number
  /** Kleines Vorschaubild als Daten-URL */
  thumb: string
  doc: RltDoc
}

export interface ProjectSummary {
  id: string
  name: string
  anlage: string
  createdAt: number
  updatedAt: number
  thumb: string
  komponenten: number
}

const DB_NAME = 'rlt-schema'
const DB_VERSION = 1
const STORE = 'projekte'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Der Projektspeicher konnte nicht geöffnet werden.'))
  })
  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = fn(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error ?? new Error('Der Zugriff auf den Projektspeicher ist fehlgeschlagen.'))
      }),
  )
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const all = await tx<ProjectRecord[]>('readonly', (s) => s.getAll() as IDBRequest<ProjectRecord[]>)
  return all
    .map((p) => ({
      id: p.id,
      name: p.name,
      anlage: p.anlage ?? '',
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      thumb: p.thumb ?? '',
      komponenten: p.doc?.nodes?.length ?? 0,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  return tx<ProjectRecord | undefined>('readonly', (s) => s.get(id) as IDBRequest<ProjectRecord | undefined>)
}

export async function putProject(record: ProjectRecord): Promise<void> {
  await tx('readwrite', (s) => s.put(record) as IDBRequest<IDBValidKey>)
}

export async function deleteProject(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id) as IDBRequest<undefined>)
}

export function newProjectId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
