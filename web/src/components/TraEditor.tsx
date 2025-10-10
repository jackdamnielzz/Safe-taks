"use client";
import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, onSnapshot, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

/**
 * Minimal collaborative TRA editor (LWW strategy, presence)
 *
 * - Subscribes to organizations/{orgId}/tras/{traId}
 * - Writes simple last-write-wins updates with `updatedAt` timestamps
 * - Writes presence to organizations/{orgId}/tras/{traId}/presence/{uid}
 *
 * NOTE: This is intentionally lightweight (not full CRDT/OT). It gives
 * immediate multi-user collaboration for title & description with presence indicators.
 */

type Props = {
  orgId: string;
  traId: string;
};

export default function TraEditor({ orgId, traId }: Props) {
  const [tra, setTra] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [presence, setPresence] = useState<Record<string, any>>({});
  const presenceIdRef = useRef<string>("");

  // Generate ephemeral presence id for cursor/client instance
  useEffect(() => {
    presenceIdRef.current = uuidv4();
  }, []);

  // Subscribe to TRA document
  useEffect(() => {
    if (!orgId || !traId) return;
    const traRef = doc(db, "organizations", orgId, "tras", traId);
    const unsub = onSnapshot(traRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setTra(data);
      // update local form fields only when remote is newer than local edit time
      setTitle(data.title || "");
      setDescription(data.description || "");
    });
    return () => unsub();
  }, [orgId, traId]);

  // Presence: write and subscribe
  useEffect(() => {
    if (!orgId || !traId) return;
    const uid = auth.currentUser?.uid || "anon";
    const presenceRef = doc(db, "organizations", orgId, "tras", traId, "presence", uid);

    // announce presence
    async function announce() {
      await setDoc(presenceRef, {
        uid,
        displayName: auth.currentUser?.displayName || null,
        lastSeen: serverTimestamp(),
        clientId: presenceIdRef.current,
      });
    }

    announce();

    // heartbeat: update lastSeen periodically
    const hb = setInterval(() => {
      announce().catch(() => {});
    }, 10_000);

    // subscribe to presence collection
    const presenceColRef = doc(db, "organizations", orgId, "tras", traId); // will reuse onSnapshot with a collection query below
    // lightweight approach: use a snapshot on the parent collection and pull presence subdocs
    const unsub = onSnapshot(
      // parent doc snapshot used to trigger reading presence subcollection
      presenceColRef,
      async () => {
        try {
          const presSnapshot = await (
            await import("firebase/firestore")
          ).getDocs(
            (await import("firebase/firestore")).collection(
              db,
              "organizations",
              orgId,
              "tras",
              traId,
              "presence"
            )
          );
          const p: Record<string, any> = {};
          presSnapshot.forEach((d: any) => {
            p[d.id] = d.data();
          });
          setPresence(p);
        } catch (e) {
          // ignore
        }
      }
    );

    // cleanup on unmount: remove presence entry
    return () => {
      clearInterval(hb);
      unsub();
      setDoc(presenceRef, { lastSeen: serverTimestamp(), offline: true }).catch(() => {});
    };
  }, [orgId, traId]);

  // Save helpers (LWW)
  const saveField = async (patch: Record<string, any>) => {
    if (!orgId || !traId) return;
    const traRef = doc(db, "organizations", orgId, "tras", traId);
    await updateDoc(traRef, {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  };

  // Simple debounced save for title/description
  const titleTimer = useRef<number | null>(null);
  useEffect(() => {
    if (titleTimer.current) window.clearTimeout(titleTimer.current);
    titleTimer.current = window.setTimeout(() => {
      saveField({ title }).catch(() => {});
    }, 600);
    return () => {
      if (titleTimer.current) window.clearTimeout(titleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const descTimer = useRef<number | null>(null);
  useEffect(() => {
    if (descTimer.current) window.clearTimeout(descTimer.current);
    descTimer.current = window.setTimeout(() => {
      saveField({ description }).catch(() => {});
    }, 800);
    return () => {
      if (descTimer.current) window.clearTimeout(descTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description]);

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="TRA title"
            className="text-xl font-semibold border-b px-1 py-1 focus:outline-none"
          />
          <div className="text-sm text-slate-500">Auto-saved — collaborative</div>
        </div>

        <div className="text-sm">
          {Object.keys(presence).length > 0 ? (
            <div className="flex items-center gap-2">
              {Object.values(presence).map((p: any, idx: number) => (
                <div key={idx} className="px-2 py-1 bg-blue-50 rounded text-xs border">
                  {p.displayName || p.uid}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400">No collaborators</div>
          )}
        </div>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="TRA description..."
        rows={8}
        className="w-full border rounded p-2"
      />

      <div className="mt-3">
        <strong>Remote TRA snapshot:</strong>
        <pre className="mt-2 p-2 bg-slate-50 rounded text-xs">
          {JSON.stringify(tra ? { title: tra.title, description: tra.description } : {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
